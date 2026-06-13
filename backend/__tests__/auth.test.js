// env vars set by globalSetup in setup.js

const request = require('supertest');
const mongoose = require('mongoose');

// Mock Redis to avoid real connection in tests
jest.mock('../../src/config/redis', () => ({
  getRedisClient: jest.fn(),
  redisGet: jest.fn().mockResolvedValue(null),
  redisSet: jest.fn().mockResolvedValue('OK'),
  redisDel: jest.fn().mockResolvedValue(1),
  redisIncr: jest.fn().mockResolvedValue(1),
  redisExpire: jest.fn().mockResolvedValue(1),
}));

const app = require('../../src/app');

let server;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  server = app.listen(0); // random port
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  server.close();
});

afterEach(async () => {
  // Clean users between tests
  await mongoose.connection.collection('users').deleteMany({});
});

describe('Auth API', () => {
  const testUser = {
    name: 'Test Student',
    email: 'test@student.com',
    password: 'SecurePass123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'not-an-email' });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('should validate password minimum length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: 'short' });

      expect(res.status).toBe(422);
    });

    it('should require name field', async () => {
      const { name, ...noName } = testUser;
      const res = await request(app).post('/api/auth/register').send(noName);
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const { token } = regRes.body.data;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
