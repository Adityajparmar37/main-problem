// env vars set by globalSetup in setup.js

// Mock Gemini SDK — prevents real API calls
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      startChat: jest.fn(),
    }),
  })),
}));

const request = require('supertest');
const mongoose = require('mongoose');

// Mock external services
jest.mock('../../src/config/redis', () => ({
  getRedisClient: jest.fn(),
  redisGet: jest.fn().mockResolvedValue(null),
  redisSet: jest.fn().mockResolvedValue('OK'),
  redisDel: jest.fn().mockResolvedValue(1),
  redisIncr: jest.fn().mockResolvedValue(1),
  redisExpire: jest.fn().mockResolvedValue(1),
}));

jest.mock('../../src/services/ai.service', () => ({
  generateFirstQuestion: jest.fn().mockResolvedValue('How are you feeling right now? Can you tell me more about what\'s on your mind?'),
  continueConversation: jest.fn().mockResolvedValue('That sounds tough. What do you think is contributing most to your stress?'),
  generateSessionReport: jest.fn().mockResolvedValue({
    emotion: 'anxious',
    trigger: 'exams',
    stressScore: 7,
    summary: 'Student is feeling anxious about upcoming exams.',
    recommendations: ['Take 5-minute breaks', 'Practice deep breathing', 'Sleep 7-8 hours'],
  }),
  transcribeAudio: jest.fn().mockResolvedValue('I am feeling very stressed about my exams'),
}));

jest.mock('../../src/services/voice.service', () => ({
  textToSpeech: jest.fn().mockResolvedValue(Buffer.from('fake-audio-data')),
}));

jest.mock('../../src/services/analytics.service', () => ({
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  getOverview: jest.fn().mockResolvedValue({ sessionsCompleted: 0, averageStress: 0 }),
  getTrends: jest.fn().mockResolvedValue({ moodTrend: [], stressTrend: [] }),
  getReport: jest.fn().mockResolvedValue({ weeklyReport: null, heatmap: [] }),
}));

const app = require('../../src/app');

let token;
let server;

const testUser = {
  name: 'Session Tester',
  email: 'session@test.com',
  password: 'TestPass123!',
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  server = app.listen(0);

  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  server.close();
});

describe('Session API', () => {
  let sessionId;

  const validContext = {
    mood: 'stressed',
    stress: 7,
    sleepHours: 5,
    studyHours: 8,
    goal: 'Finish revision for mocks',
  };

  describe('POST /api/session/start', () => {
    it('should start a session with valid context', async () => {
      const res = await request(app)
        .post('/api/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send(validContext);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.question).toBeDefined();
      expect(res.body.data.questionNumber).toBe(1);
      expect(res.body.data.maxQuestions).toBe(5);

      sessionId = res.body.data.sessionId;
    });

    it('should reject without authentication', async () => {
      const res = await request(app).post('/api/session/start').send(validContext);
      expect(res.status).toBe(401);
    });

    it('should validate mood enum', async () => {
      const res = await request(app)
        .post('/api/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validContext, mood: 'invalid_mood' });

      expect(res.status).toBe(422);
    });

    it('should validate stress range (1-10)', async () => {
      const res = await request(app)
        .post('/api/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validContext, stress: 15 });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/session/message', () => {
    it('should process a text message', async () => {
      // Start fresh session
      const startRes = await request(app)
        .post('/api/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send(validContext);
      const sid = startRes.body.data.sessionId;

      const res = await request(app)
        .post('/api/session/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ sessionId: sid, transcribedText: 'I am very stressed about my exams' });

      expect(res.status).toBe(200);
      expect(res.body.data.response).toBeDefined();
      expect(res.body.data.transcribedText).toBe('I am very stressed about my exams');
    });

    it('should require sessionId', async () => {
      const res = await request(app)
        .post('/api/session/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ transcribedText: 'hello' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/session/end', () => {
    it('should end session and return report', async () => {
      const startRes = await request(app)
        .post('/api/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send(validContext);
      const sid = startRes.body.data.sessionId;

      const res = await request(app)
        .post('/api/session/end')
        .set('Authorization', `Bearer ${token}`)
        .send({ sessionId: sid });

      expect(res.status).toBe(200);
      expect(res.body.data.report).toBeDefined();
      expect(res.body.data.report.emotion).toBeDefined();
      expect(res.body.data.report.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/session/:id', () => {
    it('should fetch session by id', async () => {
      const startRes = await request(app)
        .post('/api/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send(validContext);
      const sid = startRes.body.data.sessionId;

      const res = await request(app)
        .get(`/api/session/${sid}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session._id.toString()).toBe(sid);
    });
  });
});

describe('Analytics API', () => {
  describe('GET /api/analytics/overview', () => {
    it('should return overview', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return trends', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/analytics/report', () => {
    it('should return weekly report', async () => {
      const res = await request(app)
        .get('/api/analytics/report')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
