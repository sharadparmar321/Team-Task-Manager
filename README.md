# Team Task Manager

A comprehensive full-stack task management application with role-based access control, project and team management, task assignment with progress tracking, and an intuitive admin dashboard. Built with modern web technologies and MongoDB for scalability.

## 🎯 Overview

**Team Task Manager** enables teams to collaborate efficiently by organizing work into projects, assigning tasks to team members, and tracking progress with real-time status updates. Admins have full control over projects and tasks, while members can view assigned work and update task progress.

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js (v5.1.0)
- **Database**: MongoDB with Prisma ORM (v6.7.0)
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Validation**: Zod schema validation
- **API**: RESTful with comprehensive error handling

### Frontend
- **Framework**: React 19.0.0 with Vite bundler
- **Routing**: React Router v7.3.0
- **Styling**: CSS3 with natural color palette
- **State Management**: React Context API

## ✨ Features

### Authentication & Authorization
- ✅ Secure signup and login with JWT tokens
- ✅ Admin signup with AdminKey validation
- ✅ Role-based access control (ADMIN/MEMBER)
- ✅ Automatic token refresh and persistence
- ✅ Protected routes and API endpoints

### Project Management
- ✅ Create, edit, and manage projects
- ✅ Project status tracking (ACTIVE, ARCHIVED, COMPLETED)
- ✅ Add/remove team members from projects
- ✅ View project members and task statistics
- ✅ Separate views for active, completed, and archived projects
- ✅ Prevent modifications to completed projects

### Task Management
- ✅ Create and assign tasks to team members
- ✅ Multiple task statuses (TODO, IN_PROGRESS, DONE, COMPLETED, BLOCKED)
- ✅ Set task due dates and track overdue items
- ✅ Admin-only task closure (DONE → COMPLETED)
- ✅ Task filtering by project, status, assignee, and overdue
- ✅ Task CRUD operations with role-based access

### Dashboard & Analytics
- ✅ Real-time project summary with task counts
- ✅ Task statistics (total, by status)
- ✅ Overdue task tracking (excludes DONE/COMPLETED)
- ✅ Recent task activity (latest 6 tasks)
- ✅ Team member overview
- ✅ Role-based dashboard views

### UI/UX
- ✅ Clean, modern interface with natural color palette
- ✅ Responsive design with intuitive navigation
- ✅ Visual status badges with color-coding
- ✅ Success/error feedback messages
- ✅ Loading states and error boundaries
- ✅ Accessible form controls and buttons

## 📋 Database Schema

### Models
- **User**: Account with email, password hash, and role assignment
- **Project**: Workspace with name, description, status, and owner
- **ProjectMember**: Join table for user-project relationships
- **Task**: Individual work item with title, status, due date, and assignee

### Enums
- **Role**: `ADMIN` | `MEMBER`
- **ProjectStatus**: `ACTIVE` | `ARCHIVED` | `COMPLETED`
- **TaskStatus**: `TODO` | `IN_PROGRESS` | `DONE` | `COMPLETED` | `BLOCKED`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd "New folder"
   ```

2. **Install dependencies** from the repo root:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Create `Backend/.env`:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/webControl
   PORT=4000
   JWT_SECRET=your_secret_key_here_min_32_chars
   CLIENT_URL=http://localhost:5173
   AdminKey=1234admin
   ```

4. **Setup database**:
   ```bash
   cd Backend
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development servers**:
   
   From root directory:
   ```bash
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1: Backend
   cd Backend && npm run dev

   # Terminal 2: Frontend
   cd Frontend && npm run dev
   ```

## 🌐 Access Points

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:4000 | 4000 |
| Prisma Studio | Run `npm run prisma:studio` in Backend | 5555 |

## 👤 Demo Accounts

After running `npm run db:seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@teamtask.local | Admin123! |
| Member | member@teamtask.local | Member123! |

**Admin Features**: Create projects, manage members, close projects/tasks
**Member Features**: View assigned tasks/projects, update task status

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new account (optional adminKey)
- `POST /login` - Login and get JWT token

### Projects (`/api/projects`)
- `GET /` - List accessible projects
- `POST /` - Create project (admin only)
- `GET /:id` - Get project details
- `PATCH /:id` - Update project name/description
- `PATCH /:id/archive` - Archive project
- `PATCH /:id/close` - Close project as COMPLETED (admin only)
- `GET /:id/members` - List project members
- `POST /:id/members` - Add member (admin only)
- `DELETE /:id/members/:userId` - Remove member (admin only)

### Tasks (`/api/tasks`)
- `GET /` - List accessible tasks with filters
- `POST /` - Create task (admin only)
- `GET /:id` - Get task details
- `PATCH /:id` - Update task properties
- `PATCH /:id/status` - Update task status
- `DELETE /:id` - Delete task (admin only)

### Dashboard (`/api/dashboard`)
- `GET /summary` - Get dashboard statistics and summaries

### Users (`/api/users`)
- `GET /profile` - Get authenticated user profile

## 📁 Project Structure

```
New folder/
├── Backend/
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── index.js            # Server entry point
│   │   ├── constants.js        # Enums and constants
│   │   ├── controllers/        # Business logic (auth, projects, tasks, dashboard)
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # Auth, error handling, role validation
│   │   ├── utils/              # Helper classes (ApiError, ApiResponse)
│   │   └── config/             # Configuration files
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Database seeding
│   ├── .env                    # Environment variables
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── pages/              # Page components (Dashboard, Projects, Tasks, etc.)
│   │   ├── components/         # Reusable components (Layout, StatusBadge, etc.)
│   │   ├── context/            # React Context (AuthContext)
│   │   ├── api/                # API client with axios
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── styles.css          # Global styles
│   ├── .env                    # Environment variables
│   ├── vite.config.js          # Vite configuration
│   └── package.json
│
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
└── package.json                # Root package.json
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Authentication**: 7-day expiration with secure token storage
- **CORS Configuration**: Restricted to frontend URL
- **Input Validation**: Zod schema validation on all endpoints
- **Role-Based Access**: Controller and middleware-level enforcement
- **AdminKey Protection**: Secure admin account creation
- **Error Handling**: Comprehensive error messages without exposing internals

## 🎨 UI Features

- **Color Palette**: Natural tones (cream, sage green, warm gold, rust red)
- **Status Indicators**: Visual badges for all project and task statuses
- **Responsive Layout**: Works on desktop and tablet devices
- **Form Validation**: Client and server-side validation
- **Loading States**: Clear feedback during async operations
- **Success/Error Messages**: Non-intrusive notifications

## 📋 Environment Variables

### Backend (`Backend/.env`)
```env
DATABASE_URL=mongodb+srv://...              # MongoDB connection string
PORT=4000                                   # Server port
JWT_SECRET=your_secret_key_min_32_chars    # JWT signing secret
CLIENT_URL=http://localhost:5173            # Frontend URL for CORS
AdminKey=1234admin                          # Key for admin signup
```

### Frontend (`Frontend/.env`)
```env
VITE_API_URL=http://localhost:4000/api      # Backend API base URL
```

## 🧪 Development

### Available Commands

**Backend**:
```bash
npm run dev              # Start development server with hot reload
npm run start            # Start production server
npm run db:generate      # Regenerate Prisma client
npm run db:push          # Sync schema with MongoDB
npm run db:seed          # Seed initial data
npm run prisma:studio    # Open Prisma Studio UI
```

**Frontend**:
```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `DATABASE_URL` is correct in `Backend/.env`
- Ensure MongoDB Atlas IP whitelist includes your machine
- Check network connectivity to MongoDB Atlas

### JWT Token Errors
- Clear browser localStorage and login again
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration (7 days)

### Schema Sync Issues
- Run `npm run db:generate && npm run db:push` after schema changes
- Verify MongoDB provider in `prisma/schema.prisma`
- Check Prisma client is regenerated

### CORS Errors
- Verify `CLIENT_URL` matches frontend URL in `Backend/.env`
- Check backend is running before starting frontend
- Ensure cookies are not being blocked

## 📚 Documentation

- Prisma ORM: https://www.prisma.io/docs/
- Express.js: https://expressjs.com/
- React: https://react.dev/
- MongoDB: https://docs.mongodb.com/

## 🤝 Contributing

To contribute to this project:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request with description

## 📄 License

This project is private and not licensed for external use.

## 📞 Support

For issues or questions, please check the troubleshooting section or contact the development team.

---

**Last Updated**: May 9, 2026
**Current Version**: 1.0.0
**Database**: MongoDB Atlas
**Status**: Production Ready
