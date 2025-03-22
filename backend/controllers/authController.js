const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Teacher } = require('../models');
const { Op } = require('sequelize');

const authController = {
  // Register new user
  register: async (req, res) => {
    const { username, email, password, firstName, lastName, isTeacher, teacherId, specialization, qualification, bio } = req.body;
    
    try {
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email and password' });
      }
      
      // Check if username or email already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: isTeacher ? 'teacher' : 'student'
      });
      
      // If this is a teacher registration, create a teacher record
      if (isTeacher) {
        // Additional validation for teacher specific fields
        if (!teacherId || !specialization || !qualification) {
          // Delete the user we just created since the teacher creation will fail
          await user.destroy();
          return res.status(400).json({ 
            message: 'Teacher registration requires teacherId, specialization, and qualification' 
          });
        }
        
        // Check if teacher ID is already registered
        const existingTeacher = await Teacher.findOne({
          where: { teacherId }
        });
        
        if (existingTeacher) {
          // Delete the user we just created
          await user.destroy();
          return res.status(400).json({ message: 'Teacher ID is already registered' });
        }
        
        // Create teacher record
        await Teacher.create({
          userId: user.id,
          teacherId,
          specialization,
          qualification,
          bio: bio || ''
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        attributes: ['id', 'username', 'email', 'password', 'department']
      });

      // Debug log
      console.log('Login attempt:', {
        emailProvided: email,
        userFound: !!user
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      // Debug log
      console.log('Password check:', {
        isValid: isValidPassword
      });

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Create token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your-fallback-secret',
        { expiresIn: '24h' }
      );

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = user.toJSON();

      res.json({
        success: true,
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get current user
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Error fetching user data' });
    }
  },

  // Verify token and get user data
  verifyToken: async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: { id: decoded.id },
        attributes: ['id', 'username', 'email', 'avatarUrl', 'department']
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  }
};

module.exports = authController; 