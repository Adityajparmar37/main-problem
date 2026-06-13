const fetch = require('node-fetch');
const env = require('../config/env');
const logger = require('../config/logger');

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Convert text to speech using ElevenLabs API
 * Returns audio buffer (mp3)
 */
const textToSpeech = async (text) => {
  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${env.ELEVENLABS_VOICE_ID}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: env.ELEVENLABS_MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('ElevenLabs TTS error', { status: response.status, body: errorBody });
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }

  const buffer = await response.buffer();
  return buffer;
};

/**
 * List available voices (utility for setup)
 */
const listVoices = async () => {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY },
  });

  if (!response.ok) throw new Error('Failed to fetch voices');
  const data = await response.json();
  return data.voices;
};

module.exports = { textToSpeech, listVoices };
