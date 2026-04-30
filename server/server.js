require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const defaultFrontendUrl = 'https://jcom-website-1.onrender.com';
const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');
const allowedOrigins = [
  defaultFrontendUrl,
  'http://localhost:5173',
  'http://localhost:3000'
].map(normalizeOrigin);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(normalizeOrigin(origin));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = socketIO(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    credentials: true
  }
});

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const mongoConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
    // Seed Super Admin on first run
    const { seedSuperAdmin } = require('./controllers/authController');
    await seedSuperAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

mongoConnection();

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join personal room for notifications
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Join location room
  socket.on('join_location', (locationId) => {
    socket.join(`location_${locationId}`);
  });

  // Join table room
  socket.on('join_table', (tableId) => {
    socket.join(`table_${tableId}`);
  });

  // Chat messaging
  socket.on('send_message', async (data) => {
    const { roomId, message } = data;
    io.to(roomId).emit('receive_message', message);
  });

  // Connection request notification
  socket.on('connection_request', (data) => {
    io.to(`user_${data.toUserId}`).emit('new_connection_request', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Make io available to controllers
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/deals',       require('./routes/deals'));
app.use('/api/meetings',    require('./routes/meetings'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/stats',       require('./routes/stats'));
app.use('/api/crm',         require('./routes/crm'));

app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    return res.redirect(process.env.FRONTEND_URL);
  }

  return res.status(200).send('JCOM API is running. Use /api/health to verify the backend.');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'JCOM Server running ✅', timestamp: new Date() });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 JCOM Server running on port ${PORT}`);
});

module.exports = { app, io };
