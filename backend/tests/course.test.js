const chai = require('chai');
const chaiHttp = require('chai-http');

// Set test environment before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

const app = require('../index'); // Import app directly, not destructured
const expect = chai.expect;
const jwt = require('jsonwebtoken');

// Initialize chai-http
chai.use(chaiHttp);

describe('Course Management Tests', () => {
  let teacherToken;
  let studentToken;
  let courseId;

  before(async () => {
    // Create teacher token (using ID 3 which exists in setup)
    teacherToken = jwt.sign(
      { id: 3, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create student token (using ID 2 which exists in setup)
    studentToken = jwt.sign(
      { id: 2, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Course Creation', () => {
    it('should create a new course when teacher is authenticated', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        department: 'Computer Science',
        level: 'Beginner',
        instructorId: 3, // Use the teacher ID from setup
        duration: '8 weeks'
      };

      const res = await chai.request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(courseData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('title', courseData.title);
      courseId = res.body.id;
    });
  });

  describe('Course Retrieval', () => {
    it('should retrieve all courses', async () => {
      const res = await chai.request(app)
        .get('/api/courses');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
    });

    it('should retrieve a specific course by ID', async () => {
      if (courseId) {
        const res = await chai.request(app)
          .get(`/api/courses/${courseId}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id', courseId);
      } else {
        this.skip;
      }
    });
  });

  describe('Course Enrollment', () => {
    it('should allow students to enroll in a course', async () => {
      if (courseId) {
        const res = await chai.request(app)
          .post(`/api/courses/${courseId}/enroll`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message');
      } else {
        this.skip;
      }
    });
  });

  describe('Course Content Management', () => {
    it('should allow teachers to add course videos', async () => {
      if (courseId) {
        const response = await chai.request(app)
          .post(`/api/courses/${courseId}/videos`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            title: 'Test Video',
            description: 'Test video description',
            videoUrl: 'https://example.com/video.mp4',
            duration: 300
          });

        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('id');
      } else {
        this.skip;
      }
    });

    it('should allow students to view course videos', async () => {
      if (courseId) {
        const response = await chai.request(app)
          .get(`/api/courses/${courseId}/videos`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
      } else {
        this.skip;
      }
    });
  });

  describe('Course Progress Tracking', () => {
    it('should update student progress in a course', async () => {
      if (courseId) {
        const response = await chai.request(app)
          .put(`/api/courses/${courseId}/progress`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            progress: 50,
            completed: false
          });

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('progress', 50);
      } else {
        this.skip;
      }
    });

    it('should return course enrollments for teachers', async () => {
      if (courseId) {
        const response = await chai.request(app)
          .get(`/api/courses/${courseId}/enrollments`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
      } else {
        this.skip;
      }
    });
  });
}); 