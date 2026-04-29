# JCOM - Business Networking Platform

A comprehensive multi-location business networking platform built with React and Node.js/Express.

## 🌟 Features

### Core Features
- **User Management**: Multi-role hierarchy (Super Admin, Chairman, Members)
- **Member Registration**: Approval-based registration with location and table assignment
- **CRM System**: Complete connection and deal management
- **Chat System**: Real-time messaging between connected members
- **Meeting Management**: Monthly structured meetings (Growth, Problems, Solutions, C2C Networking)
- **Leaderboard**: Performance tracking with rankings
- **Analytics**: Comprehensive statistics and reporting

### Security
- JWT-based authentication
- Password hashing with bcryptjs
- AES encryption for sensitive data (Aadhar, PAN)
- Role-based access control (RBAC)

## 📋 Project Structure

```
jcom-website/
├── src/                          # React Frontend
│   ├── pages/                   # Page components
│   ├── components/              # Reusable components
│   ├── services/                # API services
│   ├── context/                 # React context (Auth)
│   └── App.js                   # Main app component
├── server/                      # Node.js Backend
│   ├── controllers/             # Business logic
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API routes
│   ├── middleware/              # Custom middleware
│   ├── utils/                   # Utility functions
│   └── server.js               # Express server
├── public/                      # Static files
├── package.json                 # Frontend dependencies
└── server/package.json         # Backend dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your configuration
# - MongoDB connection string
# - JWT secret
# - Email configuration (for password reset)

# Start development server
npm run dev

# Server will run on http://localhost:5000
```

### 2. Frontend Setup

```bash
# In root directory
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start React development server
npm start

# App will open on http://localhost:3000
```

## 🔐 Default User Roles

- **Super Admin**: Full system access, manages all locations and chairmen
- **Chairman**: Location-based management, approves members, assigns roles
- **Vice Chairman / Director / Treasurer**: Leadership roles (annually reset)
- **Member**: Regular member, can create connections and deals

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Public registration
- `POST /api/auth/login` - Login with Member ID and password
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/change-password` - Change password (protected)
- `PATCH /api/auth/approve/:userId` - Approve member (Chairman)
- `PATCH /api/auth/reject/:userId` - Reject member (Chairman)

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search` - Search users
- `GET /api/users/location/members` - Get location members
- `GET /api/users/table/members` - Get table members

### Connections
- `POST /api/connections` - Send connection request
- `GET /api/connections` - Get all connections
- `PATCH /api/connections/:id/accept` - Accept request
- `PATCH /api/connections/:id/reject` - Reject request
- `PATCH /api/connections/:id/spoke` - Mark as spoke
- `PATCH /api/connections/:id/follow-up` - Add follow-up
- `PATCH /api/connections/:id/disconnect` - Disconnect

### Deals
- `POST /api/deals` - Create deal
- `GET /api/deals` - Get deals
- `PATCH /api/deals/:id/confirm` - Confirm deal
- `PATCH /api/deals/:id/cancel` - Cancel deal
- `GET /api/deals/stats` - Deal statistics

### Meetings
- `POST /api/meetings` - Create meeting (Chairman)
- `GET /api/meetings` - Get meetings
- `PATCH /api/meetings/:id/attendance` - Mark attendance
- `PATCH /api/meetings/:id/complete` - Complete meeting (Chairman)

### Chat
- `POST /api/chat/:connectionId` - Send message
- `GET /api/chat/:connectionId` - Get chat history
- `GET /api/chat/unread/count` - Get unread count

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Statistics
- `GET /api/stats/overview` - Overview statistics
- `GET /api/stats/leaderboard` - Leaderboard
- `GET /api/stats/user/:userId` - User statistics

## 🗄️ Database Models

### User
- Personal & business information
- Encrypted Aadhar & PAN
- Role & approval status
- Financial metrics (revenue, connections)
- Annual role archive

### Connection
- Request/Connected/Disconnected status
- Interaction tracking (spoke, follow-ups)
- Deal conversion

### Deal
- Amount & description
- Dual confirmation mechanism
- Automatic revenue updates

### Meeting
- Type (Growth, Problems, Solutions, C2C Networking)
- Location-based with attendance tracking
- Contribution & invitation counts

### Chat & Notifications
- Real-time messaging
- Activity-based notifications
- Read status tracking

## 🔄 Workflow Examples

### Member Registration
1. User fills registration form
2. Auto-routes to location Chairman
3. Chairman approves/rejects
4. System generates Member ID & password
5. Credentials sent via email

### Connection & Deal Conversion
1. User searches for members
2. Sends connection request
3. Receiver accepts connection
4. Users can chat
5. Initiate deal proposal
6. Both confirm → revenue recorded
7. Leaderboard & stats updated

### Monthly Meetings
- **Week 1**: Growth meeting
- **Week 2**: Problems discussion
- **Week 3**: Solutions presentation
- **Week 4**: C2C Networking

## 🔒 Security Best Practices

1. **Environment Variables**: Store secrets in `.env` files
2. **JWT Tokens**: 7-day expiration by default
3. **Encryption**: AES encryption for sensitive documents
4. **RBAC**: Role-based access control on all routes
5. **Validation**: Server-side validation for all inputs
6. **CORS**: Configured for frontend domain

## 📈 Scaling Considerations

- Multi-location support built-in
- Table-based grouping (L1, L2, L3...)
- Aggregation pipelines for statistics
- Pagination support on list endpoints
- Indexing on frequently queried fields

## 🛠️ Development

### Add New Feature Steps
1. Create model in `server/models/`
2. Create controller in `server/controllers/`
3. Create routes in `server/routes/`
4. Create page/component in `src/pages/` or `src/components/`
5. Add API service in `src/services/api.js`
6. Test with Postman or similar tool

### Common Tasks

**Reset Database**
```bash
# Connect to MongoDB and drop the database
mongo
> use jcom
> db.dropDatabase()
```

**Create Super Admin User** (manual via MongoDB)
```javascript
db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@jcom.com",
  phone: "9000000000",
  location: "Krishnagiri",
  businessName: "JCOM",
  businessCategory: "Platform",
  memberId: "JCOM-ADM-2026-0001",
  password: "$2b$10$...", // bcrypt hash
  role: "Super Admin",
  status: "Approved",
  totalRevenue: 0,
  createdAt: new Date()
})
```

## 📝 Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jcom
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
ENCRYPTION_KEY=your_encryption_key_here
NODE_ENV=development
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database permissions

**CORS Error**
- Check frontend URL in server CORS config
- Ensure correct headers in requests

**JWT Token Error**
- Clear localStorage
- Log in again
- Check token expiration

## 📞 Support

For issues and questions, please create an issue in the repository.

## 📄 License

ISC

---

**JCOM © 2026** - Connecting Businesses | Generating Opportunities | Tracking Growth
