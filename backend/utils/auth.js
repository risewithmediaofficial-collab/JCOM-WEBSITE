const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate unique Membership ID (format: JCOM-LOC-YEAR-XXXX)
const generateMemberId = (location, year) => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const locCode = location.substring(0, 3).toUpperCase();
  return `JCOM-${locCode}-${year}-${randomNum}`;
};

// Generate random password
const generatePassword = () => {
  return Math.random().toString(36).slice(-10);
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare passwords
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateMemberId,
  generatePassword,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
