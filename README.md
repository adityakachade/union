# Modern CRM Platform - MERN Stack

A production-grade Customer Relationship Management (CRM) platform built for fast-scaling startups with real-time insights, automated follow-ups, and collaborative workflows.

## 🚀 Tech Stack

- **Frontend**: React + Redux Toolkit
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time**: Socket.io
- **Authentication**: JWT + Bcrypt

## 📋 Features

- ✅ **Authentication & Role Management** - JWT-based auth with role-based access control (Admin, Manager, Sales Executive)
- ✅ **Lead Management** - Full CRUD operations with ownership tracking and history trail
- ✅ **Activity Timeline** - Detailed logs of notes, calls, meetings, and status changes
- ✅ **Real-time Notifications** - WebSocket-based notifications for updates
- ✅ **Email System** - Automated email triggers for important events
- ✅ **Dashboard & Analytics** - Performance metrics with interactive charts
- ✅ **Integration Layer** - REST APIs for third-party integrations

## 🏗️ Architecture

```
Union/
├── backend/          # Express API server
│   ├── config/      # Database and app configuration
│   ├── models/      # Sequelize models
│   ├── routes/      # API routes
│   ├── controllers/ # Business logic
│   ├── middleware/  # Auth and validation middleware
│   ├── services/    # Email, WebSocket services
│   └── tests/       # Test suites
├── frontend/        # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Redux store
│   │   ├── services/   # API services
│   │   └── utils/      # Utilities
└── docker-compose.yml
```

## 🗄️ Database Schema (ER Diagram)

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│    Users    │         │    Leads    │         │  Activities   │
├─────────────┤         ├─────────────┤         ├──────────────┤
│ id (PK)     │◄──┐     │ id (PK)     │◄──┐     │ id (PK)       │
│ email       │   │     │ name        │   │     │ type          │
│ password    │   │     │ email       │   │     │ description   │
│ role        │   │     │ phone       │   │     │ leadId (FK)   │
│ name        │   │     │ company     │   │     │ userId (FK)   │
│ createdAt   │   │     │ status      │   │     │ createdAt     │
│ updatedAt   │   │     │ ownerId(FK) │──┘     │ updatedAt     │
└─────────────┘   │     │ createdAt   │        └──────────────┘
                  │     │ updatedAt   │
                  │     └─────────────┘
                  │
┌─────────────┐   │
│ Notifications│   │
├─────────────┤   │
│ id (PK)     │   │
│ userId (FK) │───┘
│ message     │
│ read        │
│ createdAt   │
└─────────────┘
```

## 🚀 Quick Start

> 📖 **Need help setting up a free PostgreSQL database?** See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions on using Supabase, Neon, or other free PostgreSQL providers.

### Prerequisites

- Node.js (v16+)
- PostgreSQL database (local or cloud - see setup instructions below)

### 🆓 Free PostgreSQL Database Setup

You can use any of these free PostgreSQL hosting services:

#### Option 1: Supabase (Recommended - Easiest)
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Go to **Settings** → **Database**
5. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
6. Use these values in your `.env` file:
   ```
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=[YOUR-PASSWORD]
   ```

#### Option 2: Neon (Serverless PostgreSQL)
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string from the dashboard
5. Extract the connection details for your `.env` file

#### Option 3: ElephantSQL
1. Go to [https://www.elephantsql.com](https://www.elephantsql.com)
2. Sign up and create a free instance
3. Copy the connection details from the dashboard
4. Use them in your `.env` file

#### Option 4: Local PostgreSQL
If you prefer to run PostgreSQL locally:
```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Create database
createdb crm_db
```

### Setup Instructions

#### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
npx sequelize-cli db:migrate

# Seed initial data (optional)
npx sequelize-cli db:seed:all

# Start server
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your backend API URL

# Start development server
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "sales_executive"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "sales_executive"
  }
}
```

### Lead Management Endpoints

#### Get All Leads
```http
GET /api/v1/leads
Authorization: Bearer <token>
```

#### Get Lead by ID
```http
GET /api/v1/leads/:id
Authorization: Bearer <token>
```

#### Create Lead
```http
POST /api/v1/leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "company": "Acme Corporation",
  "status": "new"
}
```

#### Update Lead
```http
PUT /api/v1/leads/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "contacted",
  "company": "Acme Corporation Inc"
}
```

#### Delete Lead
```http
DELETE /api/v1/leads/:id
Authorization: Bearer <token>
```

### Activity Endpoints

#### Get Activities for Lead
```http
GET /api/v1/leads/:leadId/activities
Authorization: Bearer <token>
```

#### Create Activity
```http
POST /api/v1/leads/:leadId/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "note",
  "description": "Followed up on pricing inquiry"
}
```

### Dashboard Endpoints

#### Get Dashboard Stats
```http
GET /api/v1/dashboard/stats
Authorization: Bearer <token>
```

#### Get Analytics Data
```http
GET /api/v1/dashboard/analytics
Authorization: Bearer <token>
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🔐 Role-Based Access Control

- **Admin**: Full access to all features and user management
- **Manager**: Can view all leads, assign leads, and manage team
- **Sales Executive**: Can manage own leads and view assigned leads

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000
```


## 📊 Performance Considerations

- Database indexes on frequently queried fields
- JWT token refresh mechanism
- WebSocket connection pooling
- Optimistic UI updates
- Pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Built as a technical assessment for evaluating full-stack engineering capabilities.

