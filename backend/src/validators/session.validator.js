const { z } = require('zod');

const startSessionSchema = z.object({
  mood: z.enum(['great', 'good', 'okay', 'stressed', 'overwhelmed', 'anxious', 'sad'], {
    errorMap: () => ({ message: 'Invalid mood value' }),
  }),
  stress: z
    .number({ coerce: true })
    .min(1, 'Stress must be at least 1')
    .max(10, 'Stress cannot exceed 10'),
  sleepHours: z
    .number({ coerce: true })
    .min(0, 'Sleep hours cannot be negative')
    .max(24, 'Sleep hours cannot exceed 24'),
  studyHours: z
    .number({ coerce: true })
    .min(0, 'Study hours cannot be negative')
    .max(24, 'Study hours cannot exceed 24'),
  goal: z.string().max(300, 'Goal cannot exceed 300 characters').optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  transcribedText: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

const endSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

module.exports = { startSessionSchema, sendMessageSchema, endSessionSchema };
