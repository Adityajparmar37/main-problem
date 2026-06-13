const Session = require('../models/Session');

const createSession = async ({ userId, context }) => {
  return Session.create({ userId, context });
};

const findSessionById = async (sessionId, userId) => {
  return Session.findOne({ _id: sessionId, userId });
};

const addMessage = async (sessionId, userId, message) => {
  return Session.findOneAndUpdate(
    { _id: sessionId, userId },
    {
      $push: { messages: message },
      $inc: { questionCount: message.role === 'assistant' ? 1 : 0 },
    },
    { new: true }
  );
};

const completeSession = async (sessionId, userId, report) => {
  return Session.findOneAndUpdate(
    { _id: sessionId, userId },
    { $set: { report, completed: true } },
    { new: true }
  );
};

const getUserSessions = async (userId, limit = 50) => {
  return Session.find({ userId, completed: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('context report createdAt questionCount');
};

const getSessionWithMessages = async (sessionId, userId) => {
  return Session.findOne({ _id: sessionId, userId });
};

module.exports = {
  createSession,
  findSessionById,
  addMessage,
  completeSession,
  getUserSessions,
  getSessionWithMessages,
};
