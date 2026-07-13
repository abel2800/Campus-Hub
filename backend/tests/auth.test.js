const chai = require('chai');
const chaiHttp = require('chai-http');

// Set test environment before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

const app = require('../index'); // Import app directly, not destructured
const expect = chai.expect;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize chai-http
chai.use(chaiHttp);

describe('Authentication System', () => {
  let testUser;
  let authToken;

  before(async () => {
    // Use existing test user credentials
    testUser = {
      email: 'test@example.com',
      password: 'password123',
      username: 'Test User',
      department: 'Computer Science'
    };
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const uniqueUser = {
        email: 'newuser' + Date.now() + '@example.com', // Use timestamp for uniqueness
        password: 'password123',
        username: 'New Test User',
        department: 'Computer Science'
      };

      const res = await chai.request(app)
        .post('/api/auth/register')
        .send(uniqueUser);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('email', uniqueUser.email);
    });

    it('should not register a user with existing email', async () => {
      const res = await chai.request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com', // Use existing test user email
          password: 'password123',
          username: 'Another Test User',
          department: 'Computer Science'
        });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message');
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
      authToken = res.body.token;
    });

    it('should login with existing test user credentials', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
      authToken = res.body.token;
    });

    it('should not login with invalid password', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });

  describe('Token Validation', () => {
    it('should validate a valid token', async () => {
      // First login to get a valid token
      const loginRes = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(loginRes).to.have.status(200);
      const validToken = loginRes.body.token;

      const res = await chai.request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res).to.have.status(200);
    });

    it('should reject an invalid token', async () => {
      const res = await chai.request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res).to.have.status(401);
    });
  });
});
