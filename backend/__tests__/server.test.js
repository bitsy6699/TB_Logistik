const request = require('supertest');

describe('API Server', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = require('../server');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    token = res.body.token;
  });

  describe('GET /api/health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject empty credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('should reject nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nouser', password: 'test' });
      expect(res.status).toBe(401);
    });

    it('should return JWT on valid login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('Administrator');
    });
  });

  describe('GET /api/customers', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
    });

    it('should return data with valid token', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
