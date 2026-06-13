const multer = require('multer');
const sessionService = require('../services/session.service');
const voiceService = require('../services/voice.service');
const aiService = require('../services/ai.service');
const { success, error } = require('../utils/apiResponse');
const logger = require('../config/logger');

// Multer config for audio upload (in-memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    cb(new Error('Only audio files are allowed'), false);
  },
});

const uploadAudio = upload.single('audio');

/**
 * POST /session/start
 * Body: { mood, stress, sleepHours, studyHours, goal }
 */
const startSession = async (req, res) => {
  const userId = req.user._id.toString();
  const { mood, stress, sleepHours, studyHours, goal } = req.body;

  const result = await sessionService.startSession(userId, {
    mood,
    stress: Number(stress),
    sleepHours: Number(sleepHours),
    studyHours: Number(studyHours),
    goal,
  });

  // Generate TTS for first question
  try {
    const audioBuffer = await voiceService.textToSpeech(result.question);
    const audioBase64 = audioBuffer.toString('base64');
    return success(res, { ...result, audioBase64 }, 'Session started', 201);
  } catch (ttsError) {
    logger.warn('TTS generation failed, returning text only', { error: ttsError.message });
    return success(res, { ...result, audioBase64: null }, 'Session started', 201);
  }
};

/**
 * POST /session/message
 * Multipart: audio file OR JSON body with transcribedText
 */
const sendMessage = async (req, res) => {
  const userId = req.user._id.toString();
  const { sessionId } = req.body;

  if (!sessionId) return error(res, 'sessionId is required', 400);

  let transcribedText;

  // If audio file uploaded, transcribe it
  if (req.file) {
    try {
      transcribedText = await aiService.transcribeAudio(req.file.buffer, req.file.mimetype);
    } catch (transcribeErr) {
      logger.error('Transcription failed', { error: transcribeErr.message });
      return error(res, 'Audio transcription failed', 422);
    }
  } else if (req.body.transcribedText) {
    transcribedText = req.body.transcribedText;
  } else {
    return error(res, 'Either audio file or transcribedText is required', 400);
  }

  if (!transcribedText || transcribedText.trim().length === 0) {
    return error(res, 'Empty transcription, please speak clearly', 422);
  }

  const result = await sessionService.processMessage(sessionId, userId, transcribedText);

  // Generate TTS for AI response
  let audioBase64 = null;
  try {
    const audioBuffer = await voiceService.textToSpeech(result.response);
    audioBase64 = audioBuffer.toString('base64');
  } catch (ttsError) {
    logger.warn('TTS failed', { error: ttsError.message });
  }

  return success(res, { ...result, transcribedText, audioBase64 }, 'Message processed');
};

/**
 * POST /session/end
 * Body: { sessionId }
 */
const endSession = async (req, res) => {
  const userId = req.user._id.toString();
  const { sessionId } = req.body;

  if (!sessionId) return error(res, 'sessionId is required', 400);

  const result = await sessionService.endSession(sessionId, userId);

  return success(res, result, 'Session completed');
};

/**
 * GET /session/:id
 */
const getSession = async (req, res) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const session = await sessionService.getSession(id, userId);
  return success(res, { session }, 'Session fetched');
};

module.exports = { startSession, sendMessage, endSession, getSession, uploadAudio };
