const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Teacher } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');
const auth = require('../middleware/auth');
const { buildAuthResponse } = require('../utils/authResponse');
const { createOtp, verifyOtp } = require('../utils/otp');
const { assertTeacherEmail, assertStudentEmail } = require('../utils/teacherEmail');

async function handleRegisterRequest(req, res) {
  try {
    const { email, password, username, department } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, username and password are required' });
    }
    if (!department) {
      return res.status(400).json({ message: 'Department is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    assertStudentEmail(normalizedEmail);
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameTaken = await User.findOne({ where: { username } });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await createOtp(normalizedEmail, 'register', {
      username,
      passwordHash,
      department: department || '',
    });

    res.json({ ...result, requiresOtp: true });
  } catch (error) {
    console.error('Register OTP request error:', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Could not send verification code' });
  }
}

async function handleRegisterVerify(req, res) {
  try {
    const { email, otp } = req.body;
    const { payload } = await verifyOtp(email, 'register', otp);

    if (!payload?.username || !payload?.passwordHash) {
      return res.status(400).json({ message: 'Registration session expired. Please sign up again.' });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameTaken = await User.findOne({ where: { username: payload.username } });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const newUser = await User.create({
      email: normalizedEmail,
      username: payload.username,
      password: payload.passwordHash,
      department: payload.department || '',
    });

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json(await buildAuthResponse(newUser, token));
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Verification failed' });
  }
}

async function handleTeacherRegisterRequest(req, res) {
  try {
    const {
      email,
      password,
      username,
      department,
      bio,
    } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, username and password are required' });
    }
    if (!department) {
      return res.status(400).json({ message: 'Teaching department is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    assertTeacherEmail(normalizedEmail);
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameTaken = await User.findOne({ where: { username: username.trim() } });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teacherId = `T-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await createOtp(normalizedEmail, 'register_teacher', {
      username: username.trim(),
      passwordHash,
      department: department.trim(),
      teacherId,
      specialization: department.trim(),
      qualification: 'Faculty',
      bio: bio || '',
    });

    res.json({ ...result, requiresOtp: true, isTeacher: true });
  } catch (error) {
    console.error('Teacher register OTP request error:', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Could not send verification code' });
  }
}

async function handleTeacherRegisterVerify(req, res) {
  try {
    const { email, otp } = req.body;
    const { payload } = await verifyOtp(email, 'register_teacher', otp);

    if (!payload?.username || !payload?.passwordHash || !payload?.teacherId) {
      return res.status(400).json({ message: 'Registration session expired. Please sign up again.' });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameTaken = await User.findOne({ where: { username: payload.username } });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const teacherIdTaken = await Teacher.findOne({ where: { teacherId: payload.teacherId } });
    if (teacherIdTaken) {
      return res.status(400).json({ message: 'Teacher ID is already registered' });
    }

    const newUser = await User.create({
      email: normalizedEmail,
      username: payload.username,
      password: payload.passwordHash,
      department: payload.department || payload.specialization || '',
      bio: payload.bio || '',
    });

    await Teacher.create({
      userId: newUser.id,
      teacherId: payload.teacherId,
      specialization: payload.specialization,
      qualification: payload.qualification,
      expertise: payload.specialization,
      bio: payload.bio || '',
      isVerified: false,
    });

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json(await buildAuthResponse(newUser, token));
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Verification failed' });
  }
}

router.post('/register/teacher/request', handleTeacherRegisterRequest);
router.post('/register/teacher/verify', handleTeacherRegisterVerify);

router.post('/register/request', handleRegisterRequest);
router.post('/register/verify', handleRegisterVerify);

// Student or teacher registration (OTP)
router.post('/register', async (req, res) => {
  if (req.body.isTeacher) {
    if (req.body.otp) {
      return handleTeacherRegisterVerify(req, res);
    }
    return handleTeacherRegisterRequest(req, res);
  }
  if (req.body.otp) {
    return handleRegisterVerify(req, res);
  }
  return handleRegisterRequest(req, res);
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const loginId = (email || username || '').toString().trim();
    console.log('Login attempt:', { loginId });

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const isEmail = loginId.includes('@');
    const user = await User.findOne({
      where: isEmail
        ? { email: loginId.toLowerCase() }
        : { username: loginId },
      attributes: ['id', 'email', 'password', 'username', 'department', 'avatar', 'bio'],
    });

    if (!user) {
      console.log('User not found:', loginId);
      return res.status(401).json({
        message: 'Invalid credentials. If you just signed up, complete email verification with your OTP first.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', loginId);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json(await buildAuthResponse(user, token));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/verify', auth, authController.verifyToken);
router.get('/me', auth, authController.getMe);

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.json({
        ok: true,
        message: 'If that email is registered, you will receive a reset code.',
      });
    }

    const result = await createOtp(email, 'reset', { userId: user.id });
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Could not send reset code' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password, token } = req.body;

    if (token) {
      const { resetPassword } = require('../utils/passwordReset');
      const result = await resetPassword(token, password);
      return res.json(result);
    }

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const { payload } = await verifyOtp(email, 'reset', otp);
    const userId = payload?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'Reset session expired. Request a new code.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ ok: true, message: 'Password updated successfully. You can sign in now.' });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Could not reset password' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'department', 'avatar', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

module.exports = router;
