const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Gemini (replaces OpenAI)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  // ElevenLabs TTS (free plan)
  ELEVENLABS_API_KEY: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'), // Rachel — free plan
  ELEVENLABS_MODEL_ID: z.string().default('eleven_monolingual_v1'),  // free plan model

  // Rate limiting
  MAX_SESSIONS_PER_DAY: z.string().default('20'),

  // Session / cache TTLs
  SESSION_TTL_SECONDS: z.string().default('1800'),
  ANALYTICS_CACHE_TTL_SECONDS: z.string().default('3600'),
  REPORT_CACHE_TTL_SECONDS: z.string().default('900'),
  MAX_QUESTIONS_PER_SESSION: z.string().default('5'),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error('❌ Invalid environment variables:');
  console.error(err.flatten().fieldErrors);
  process.exit(1);
}

module.exports = env;
