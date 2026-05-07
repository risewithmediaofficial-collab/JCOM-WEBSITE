const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach full user document so controllers can use req.user.locationId etc.
    const user = await User.findById(decoded.userId)
      .select('-password -aadharNumber -panNumber -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
};

module.exports = { authenticateToken, authorize };
