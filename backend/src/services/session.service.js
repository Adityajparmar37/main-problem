const { v4: uuidv4 } = require('uuid');
const { redisGet, redisSet, redisDel } = require('../config/redis');
const sessionQuery = require('../queries/session.query');
const aiService = require('./ai.service');
const analyticsService = require('./analytics.service');
const env = require('../config/env');
const logger = require('../config/logger');

const SESSION_TTL = parseInt(env.SESSION_TTL_SECONDS, 10);
const REPORT_TTL = parseInt(env.REPORT_CACHE_TTL_SECONDS, 10);
const MAX_QUESTIONS = parseInt(env.MAX_QUESTIONS_PER_SESSION, 10);

/**
 * Start a new session: persist to DB, init Redis state, generate first question
 */
const startSession = async (userId, context) => {
  // Create DB record
  const session = await sessionQuery.createSession({ userId, context });
  const sessionId = session._id.toString();

  // Generate first AI question
  const firstQuestion = await aiService.generateFirstQuestion(context);

  // Init Redis session state
  const sessionState = {
    userId,
    context,
    messages: [{ role: 'assistant', content: firstQuestion, timestamp: new Date().toISOString() }],
    questionCount: 1,
    currentQuestion: firstQuestion,
  };
  await redisSet(`session:${sessionId}`, sessionState, SESSION_TTL);

  // Save first message to DB
  await sessionQuery.addMessage(sessionId, userId, {
    role: 'assistant',
    content: firstQuestion,
  });

  logger.info('Session started', { sessionId, userId });

  return { sessionId, question: firstQuestion, questionNumber: 1, maxQuestions: MAX_QUESTIONS };
};

/**
 * Process user message: update Redis state, generate AI response
 */
const processMessage = async (sessionId, userId, userMessage) => {
  // Load session from Redis
  let sessionState = await redisGet(`session:${sessionId}`);

  if (!sessionState) {
    // Fallback: rebuild from DB
    const dbSession = await sessionQuery.getSessionWithMessages(sessionId, userId);
    if (!dbSession) throw Object.assign(new Error('Session not found or expired'), { statusCode: 404 });

    sessionState = {
      userId: userId.toString(),
      context: dbSession.context,
      messages: dbSession.messages,
      questionCount: dbSession.questionCount || 1,
    };
  }

  if (sessionState.userId.toString() !== userId.toString()) {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }

  const isLastQuestion = sessionState.questionCount >= MAX_QUESTIONS;

  // Add user message
  const userEntry = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
  sessionState.messages.push(userEntry);

  // Save user message to DB
  await sessionQuery.addMessage(sessionId, userId, { role: 'user', content: userMessage });

  // Generate AI response
  const aiResponse = await aiService.continueConversation(
    sessionState,
    userMessage,
    sessionState.questionCount + 1
  );

  // Add AI response
  const aiEntry = { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() };
  sessionState.messages.push(aiEntry);
  sessionState.questionCount += 1;

  // Save AI message to DB
  await sessionQuery.addMessage(sessionId, userId, { role: 'assistant', content: aiResponse });

  const sessionEnded = sessionState.questionCount >= MAX_QUESTIONS || isLastQuestion;

  // Update Redis
  if (!sessionEnded) {
    await redisSet(`session:${sessionId}`, sessionState, SESSION_TTL);
  } else {
    // Keep Redis briefly for report generation
    await redisSet(`session:${sessionId}`, sessionState, REPORT_TTL);
  }

  logger.info('Message processed', { sessionId, questionCount: sessionState.questionCount, sessionEnded });

  return {
    response: aiResponse,
    questionNumber: sessionState.questionCount,
    maxQuestions: MAX_QUESTIONS,
    sessionEnded,
  };
};

/**
 * End session: generate report, persist to DB, clear Redis
 */
const endSession = async (sessionId, userId) => {
  const sessionState = await redisGet(`session:${sessionId}`);

  let messages, context;

  if (sessionState) {
    messages = sessionState.messages;
    context = sessionState.context;
  } else {
    const dbSession = await sessionQuery.getSessionWithMessages(sessionId, userId);
    if (!dbSession) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    messages = dbSession.messages;
    context = dbSession.context;
  }

  // Cache report generation in Redis temporarily
  await redisSet(`report:${sessionId}`, { status: 'generating' }, REPORT_TTL);

  // Generate report
  const report = await aiService.generateSessionReport(messages, context);

  // Persist to DB
  const completedSession = await sessionQuery.completeSession(sessionId, userId, report);

  // Clean up Redis
  await redisDel(`session:${sessionId}`);
  await redisDel(`report:${sessionId}`);

  // Invalidate analytics cache
  await analyticsService.invalidateCache(userId);

  logger.info('Session ended', { sessionId, userId });

  return { report, session: completedSession };
};

/**
 * Get session details
 */
const getSession = async (sessionId, userId) => {
  const session = await sessionQuery.getSessionWithMessages(sessionId, userId);
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  return session;
};

module.exports = { startSession, processMessage, endSession, getSession };
