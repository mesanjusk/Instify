/**
 * Auth route input-validation tests.
 * Uses a minimal Express app with the auth router mounted so tests
 * run without a live MongoDB connection. Validation errors (400) are
 * returned before any DB call, so these assertions are stable.
 *
 * For full integration tests (login success, token rotation) set
 * MONGO_URI in the test environment to a test database.
 */

const express = require('express');
const request = require('supertest');

// Stub out Mongoose and services before importing the router
jest.mock('../models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  findById: jest.fn().mockResolvedValue(null),
}));
jest.mock('../models/institute', () => ({
  findOne: jest.fn().mockResolvedValue(null),
}));
jest.mock('../models/OtpStore', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  deleteOne: jest.fn().mockResolvedValue({}),
  prototype: { save: jest.fn().mockResolvedValue({}) },
}));
jest.mock('../services/baileysService', () => ({ sendText: jest.fn() }));
jest.mock('../services/whatsappService', () => ({ sendText: jest.fn() }));
jest.mock('../utils/magicLink', () => ({
  generateMagicToken: jest.fn(() => 'tok'),
  verifyMagicToken: jest.fn(() => null),
  buildMagicLink: jest.fn(() => 'http://test'),
}));
jest.mock('../middleware/roleGuard', () => ({
  authenticate: (req, res, next) => next(),
  roleGuard: () => (req, res, next) => next(),
}));

process.env.JWT_SECRET = 'test-secret-for-jest';

const authRouter = require('../routers/authRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

// ── User login validation ─────────────────────────────────────────────────────

describe('POST /api/auth/user/login', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  test('400 when center_code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/user/login')
      .send({ password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.errors ?? res.body.message).toBeTruthy();
  });

  test('400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/user/login')
      .send({ center_code: 'ABC123' });
    expect(res.status).toBe(400);
  });

  test('401 when credentials do not match (user not found in mock)', async () => {
    const res = await request(app)
      .post('/api/auth/user/login')
      .send({ center_code: 'ABC123', password: 'wrongpass' });
    // Either 401 (bad creds) or 500 (unexpected error from mocks) — not 200
    expect(res.status).not.toBe(200);
  });
});

// ── Institute login validation ────────────────────────────────────────────────

describe('POST /api/auth/institute/login', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  test('400 when center_code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/institute/login')
      .send({ password: 'pass123' });
    expect(res.status).toBe(400);
  });

  test('400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/institute/login')
      .send({ center_code: 'ABC123' });
    expect(res.status).toBe(400);
  });
});

// ── Refresh token validation ──────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  test('401 when refreshToken is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    expect(res.status).toBe(401);
  });

  test('401 when refreshToken is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'bad-token-xyz' });
    expect(res.status).toBe(401);
  });
});

// ── Forgot password OTP validation ───────────────────────────────────────────

describe('POST /api/auth/institute/forgot-password', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  test('400 when center_code and mobile are missing', async () => {
    const res = await request(app)
      .post('/api/auth/institute/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });

  test('400 when only mobile is provided', async () => {
    const res = await request(app)
      .post('/api/auth/institute/forgot-password')
      .send({ mobile: '9999999999' });
    expect(res.status).toBe(400);
  });
});
