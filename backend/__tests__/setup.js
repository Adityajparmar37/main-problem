// Jest global setup — runs once before all test suites
module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/mindmate_test';
  process.env.JWT_SECRET = 'test_secret_key_for_jest_testing_32chars';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.REDIS_URL = 'redis://localhost:6379';

  // Gemini (mocked in tests — no real API calls)
  process.env.GEMINI_API_KEY = 'test-gemini-api-key';
  process.env.GEMINI_MODEL = 'gemini-2.0-flash';

  // ElevenLabs free plan (mocked in tests)
  process.env.ELEVENLABS_API_KEY = 'test-el-key';
  process.env.ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
  process.env.ELEVENLABS_MODEL_ID = 'eleven_monolingual_v1';

  process.env.MAX_SESSIONS_PER_DAY = '20';
  process.env.SESSION_TTL_SECONDS = '1800';
  process.env.ANALYTICS_CACHE_TTL_SECONDS = '3600';
  process.env.REPORT_CACHE_TTL_SECONDS = '900';
  process.env.MAX_QUESTIONS_PER_SESSION = '5';
  process.env.FRONTEND_URL = 'http://localhost:5173';
};
