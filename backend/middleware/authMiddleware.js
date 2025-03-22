const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Authorization header is not a Bearer token');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Token is empty after splitting');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    console.log('Verifying token...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    
    // Verify that the user exists in the database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      console.log(`User with ID ${decoded.id} not found in database`);
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log(`User ${user.username} (${user.id}) authenticated successfully`);
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error during authentication' });
  }
}; 