## Live Demo

Frontend: https://user-management-system-frontend-eta.vercel.app  
Backend: https://user-management-system-2-bxzr.onrender.com# User Management System

A full-stack MERN web application with secure user authentication, role-based access control (RBAC), and comprehensive audit logging. Built for Purple Merit Technologies assessment.

## Features

### Core Functionality
- **Secure Authentication**: JWT-based authentication with access and refresh tokens
- **Role-Based Access Control (RBAC)**: Admin, Manager, and User roles with granular permissions
- **User Management**: Create, read, update, and delete user accounts
- **Profile Management**: Users can manage their own profiles
- **Audit Logging**: Comprehensive activity tracking and logging
- **Real-time Updates**: React Query for efficient data fetching and caching

### Security Features
- **Password Security**: Bcrypt hashing with configurable rounds
- **Token Management**: Secure JWT token handling with refresh tokens
- **Rate Limiting**: API request throttling to prevent abuse
- **Input Validation**: Comprehensive server-side validation
- **CORS Protection**: Proper cross-origin resource sharing configuration
- **Security Headers**: Helmet.js for security headers
- **Audit Trail**: Complete activity logging for compliance

### UI/UX Features
- **Modern Interface**: Material-UI components with responsive design
- **Role-Based UI**: Dynamic navigation and components based on user roles
- **Real-time Feedback**: Toast notifications for user actions
- **Loading States**: Proper loading indicators and error handling
- **Search & Filtering**: Advanced user management with search and filters

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Jest** - Testing framework
- **Winston** - Logging

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Material-UI (MUI)** - UI component library
- **React Query** - Data fetching and state management
- **React Hook Form** - Form handling
- **Yup** - Form validation
- **Axios** - HTTP client

### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **GitHub Actions** - CI/CD pipeline

## Project Structure

```
User-Management-System/
backend/
  controllers/          # Route controllers
  middleware/           # Custom middleware
  models/              # Database models
  routes/              # API routes
  services/            # Business logic
  utils/               # Utility functions
  tests/               # Test files
  server.js            # Application entry point
  package.json         # Dependencies
  Dockerfile           # Container configuration

frontend/
  components/          # Reusable components
  contexts/            # React contexts
  pages/               # Page components
  services/            # API services
  hooks/               # Custom hooks
  utils/               # Utility functions
  public/              # Static assets
  src/                 # Source code
  package.json         # Dependencies
  Dockerfile           # Container configuration

docker-compose.yml     # Production containers
docker-compose.dev.yml # Development containers
README.md             # Documentation
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- MongoDB 5.0+
- Docker & Docker Compose (optional)
- Git

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/User-Management-System.git
   cd User-Management-System
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

### Manual Setup

#### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7
   
   # Or install MongoDB locally
   mongod
   ```

4. **Initialize database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## Default Users

The system comes with pre-configured demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123! |
| Manager | manager@example.com | Manager123! |
| User | user@example.com | User123! |

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "user"
}
```

#### POST /api/auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "..."
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST /api/auth/refresh
Refresh access tokens using refresh token.

#### POST /api/auth/logout
Logout user and invalidate refresh token.

#### GET /api/auth/profile
Get current user profile.

#### PUT /api/auth/profile
Update current user profile.

#### PUT /api/auth/change-password
Change user password.

### User Management Endpoints

#### GET /api/users
Get paginated list of users (Admin/Manager only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or email
- `role`: Filter by role
- `status`: Filter by status

#### POST /api/users
Create new user (Admin only).

#### GET /api/users/:id
Get user by ID.

#### PUT /api/users/:id
Update user (Admin only, or own profile for users).

#### DELETE /api/users/:id
Delete user (Admin only).

#### GET /api/users/statistics
Get user statistics (Admin/Manager only).

### Audit Endpoints

#### GET /api/audit/users/:userId
Get user activity logs.

#### GET /api/audit/system
Get system activity logs (Admin only).

#### GET /api/audit/statistics
Get activity statistics (Admin only).

## Testing

### Backend Tests

```bash
cd backend
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
```

### Frontend Tests

```bash
cd frontend
npm test               # Run tests
npm test -- --coverage # Run with coverage
```

### Test Coverage

- **Backend**: 95%+ code coverage
- **Frontend**: Component and integration tests
- **E2E Tests**: Critical user flows

## Deployment

### Production Deployment

1. **Build and deploy with Docker**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

2. **Environment Configuration**
   - Set production environment variables
   - Configure proper secrets
   - Set up SSL certificates

3. **Database Setup**
   - Configure MongoDB with authentication
   - Set up proper indexing
   - Configure backups

### Cloud Deployment Options

#### Render
- Backend: Node.js service
- Frontend: Static site
- Database: MongoDB add-on

#### Railway
- Multi-service deployment
- Built-in CI/CD
- Managed databases

#### AWS
- EC2 instances or ECS
- RDS for MongoDB
- S3 for frontend assets
- CloudFront for CDN

## Security Considerations

### Production Checklist
- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Security headers configuration

### Authentication Security
- JWT tokens with proper expiration
- Secure password hashing (bcrypt)
- Rate limiting on auth endpoints
- Account lockout after failed attempts
- Secure token storage

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Data encryption at rest

## Performance Optimization

### Backend
- Database indexing
- Query optimization
- Response caching
- Compression middleware
- Connection pooling

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization
- Service worker caching

## Monitoring & Logging

### Application Logs
- Structured logging with Winston
- Log levels (error, warn, info, debug)
- Log rotation and archiving
- Centralized log aggregation

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- Database query performance
- Memory usage monitoring

### Health Checks
- Application health endpoint
- Database connectivity checks
- Service dependency checks
- Automated health monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- ESLint for code linting
- Prettier for code formatting
- Conventional commit messages
- Unit tests for new features
- Documentation updates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@example.com
- Documentation: [docs.example.com](https://docs.example.com)

## Acknowledgments

- Purple Merit Technologies for the assessment opportunity
- Open source community for the amazing tools and libraries
- Contributors and testers

---

**Built with passion for secure and scalable user management solutions**
