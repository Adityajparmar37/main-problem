const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const logger = require('../config/logger');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are MindMate, a compassionate and supportive AI mental wellness companion for students.

Your role:
- Listen actively and respond with genuine empathy
- Ask ONE focused follow-up question per response
- Use a calm, warm, non-judgmental tone
- Never diagnose any mental health condition
- Suggest practical coping strategies: breathing exercises, study breaks, reflection prompts
- Keep responses concise (2–4 sentences + 1 question)

Guidelines:
- If stress > 7, prioritise calming techniques before asking the next question
- If sleep < 5, acknowledge the impact of sleep deprivation gently
- Ask about root causes in a soft, curious way
- You are NOT a therapist — you are a caring peer companion
- End naturally after 5 questions with a summary and encouragement (no more questions after that)`;

/**
 * Generate the first AI question based on session context
 */
const generateFirstQuestion = async (context) => {
  const { mood, stress, sleepHours, studyHours, goal } = context;

  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = `Student's current state:
- Mood: ${mood}
- Stress level: ${stress}/10
- Sleep last night: ${sleepHours} hours
- Study hours today: ${studyHours} hours
- Today's goal: ${goal || 'Not specified'}

Please start the wellness check-in with a warm, empathetic opening and ask your first question.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

/**
 * Continue conversation using Gemini chat session with message history
 */
const continueConversation = async (sessionState, userMessage, questionCount) => {
  const { context, messages } = sessionState;

  const systemWithContext = `${SYSTEM_PROMPT}

Student context: Mood=${context.mood}, Stress=${context.stress}/10, Sleep=${context.sleepHours}h, Study=${context.studyHours}h.
This is question ${questionCount} of 5.
${questionCount >= 5 ? 'This is the FINAL exchange. Wrap up warmly with encouragement and a summary. Do NOT ask another question.' : ''}`;

  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: systemWithContext,
  });

  // Build history — Gemini requires alternating user/model roles
  const history = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    history.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return result.response.text().trim();
};

/**
 * Generate a structured session report using Gemini
 */
const generateSessionReport = async (messages, context) => {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'Student' : 'MindMate'}: ${m.content}`)
    .join('\n');

  const prompt = `Based on this mental wellness check-in conversation, generate a structured JSON report.

Context: Mood=${context.mood}, Stress=${context.stress}/10, Sleep=${context.sleepHours}h, Study=${context.studyHours}h

Conversation:
${conversation}

Respond with ONLY a valid JSON object (no markdown, no code fences) in this exact shape:
{
  "emotion": "primary emotion detected (e.g., anxious, overwhelmed, hopeful, calm)",
  "trigger": "main stress trigger identified (e.g., exams, sleep deprivation, peer pressure)",
  "stressScore": <number 1-10 based on conversation>,
  "summary": "2-3 sentence summary of the student's mental state",
  "recommendations": ["actionable recommendation 1", "recommendation 2", "recommendation 3"]
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  try {
    // Strip markdown code fences if Gemini adds them
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    logger.error('Failed to parse Gemini report JSON', { error: err.message, raw });
    return {
      emotion: 'undetermined',
      trigger: 'undetermined',
      stressScore: context.stress,
      summary: 'Session completed. Review your conversation for insights.',
      recommendations: [
        'Practice deep breathing for 5 minutes',
        'Take regular breaks during study sessions',
        'Aim for 7–8 hours of sleep tonight',
      ],
    };
  }
};

/**
 * Transcribe audio using Gemini's multimodal audio understanding
 * Sends audio buffer as inline base64 data — no Whisper/OpenAI needed
 */
const transcribeAudio = async (audioBuffer, mimeType = 'audio/webm') => {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  // Normalise MIME type — Gemini supports audio/webm, audio/mp4, audio/wav, audio/ogg
  const supportedMime = mimeType.includes('webm') ? 'audio/webm'
    : mimeType.includes('mp4') ? 'audio/mp4'
    : mimeType.includes('wav') ? 'audio/wav'
    : mimeType.includes('ogg') ? 'audio/ogg'
    : 'audio/webm';

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: supportedMime,
        data: audioBuffer.toString('base64'),
      },
    },
    'Please transcribe this audio accurately. Return ONLY the transcribed text with no additional commentary, labels, or formatting.',
  ]);

  const transcription = result.response.text().trim();
  logger.debug('Gemini transcription', { length: transcription.length });
  return transcription;
};

module.exports = {
  generateFirstQuestion,
  continueConversation,
  generateSessionReport,
  transcribeAudio,
};
