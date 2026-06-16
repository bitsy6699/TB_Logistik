const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test_secret';
const { authenticate, authorize } = require('../middleware/auth');

describe('authenticate middleware', () => {
  it('should pass with valid token', () => {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'Administrator' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(1);
  });

  it('should reject request without token', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalid_token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with malformed auth header', () => {
    const req = { headers: { authorization: 'NotBearer token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorize middleware', () => {
  it('should pass when role matches', () => {
    const req = { user: { role: 'Administrator' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorize('Administrator')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should pass when user has one of multiple allowed roles', () => {
    const req = { user: { role: 'Operator' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorize('Administrator', 'Operator')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject when role does not match', () => {
    const req = { user: { role: 'Operator' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorize('Administrator')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject when no user', () => {
    const req = { user: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorize('Administrator')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
