# Campus Hub

Campus Hub is an advanced e-learning and social media platform designed to enhance student engagement, course learning, and social interaction within universities.

## Features

### 📚 E-Learning
- **Course Management:** Teachers can create, edit, and manage courses with detailed analytics
- **Video Content:** Support for video uploads with progress tracking
- **Student Enrollment:** Self-enrollment system with progress statistics
- **Grade Management:** Teachers can assign grades and students can track their performance
- **Progress Tracking:** Real-time tracking of video completion and course progress

<<<<<<< HEAD
### 🏫 Social Media
- **User Profiles:** Customizable profiles with avatars and biographical information
- **Social Posts:** Students can create posts with text, photos, and videos
- **Interactions:** Like, comment, and share functionality for all posts
- **Friend System:** Add friends and manage connections
- **Real-time Chat:** Private messaging between users with notification support
=======
### 🏫 Social Media (for Students & Teachers)
- **User Profiles:** Customizable profiles with avatars and biographical information
- **Social Posts:** Users can create posts with text, photos, and videos
- **Story Sharing:** Users can share temporary stories visible for 24 hours
- **Interactions:** Like, comment, and share functionality for all posts
- **Friend System:** Add friends and manage connections between students and teachers
- **Real-time Chat:** Private messaging between all platform users with notification support
>>>>>>> bb52ff8 (full complet code no error)

### 👨‍🏫 Teacher Features
- **Dashboard:** Analytics showing student counts, revenue, and overall engagement
- **Course Creation:** Intuitive interface for creating and organizing course content
- **Student Management:** View enrolled students and their progress
- **Performance Metrics:** Track student engagement and success rates
- **Grade Assignment:** Assign and manage student grades
<<<<<<< HEAD
=======
- **Teacher Social Networking:** Connect with students through the same social features available to students
- **View Switching:** Easily switch between teacher dashboard and student view modes

## Role-Based Access
- **Students:** Access to course enrollment, learning materials, and all social features
- **Teachers:** Full course management capabilities plus access to the same social networking features as students
- **Shared Features:** Both students and teachers can use profiles, social media, chat, and friend connections
- **Dual Interface:** Teachers can access both the teaching dashboard and student experience from the same account
>>>>>>> bb52ff8 (full complet code no error)

## Technical Architecture

### Frontend
- **Framework:** React 18 with hooks and context API
- **UI Library:** Ant Design for responsive components
- **State Management:** React Context API for global state
- **Routing:** React Router v6 for navigation
- **API Integration:** Axios for RESTful API calls
- **Real-time Features:** Socket.IO for chat and notifications

### Backend
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT with refresh token mechanism
- **File Storage:** Local storage for development, AWS S3 for production
- **API Design:** RESTful API architecture
- **Middleware:** Custom middleware for auth, validation, and error handling

## Installation

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
- Git

### Environment Setup

#### 1. Clone the repository
```sh
git clone https://github.com/abel2800/Campus-Hub.git
cd Campus-Hub
```

#### 2. Set up the backend
```sh
cd backend

# Install dependencies
yarn install

# Create a .env file
cp .env.example .env
```

Edit the `.env` file with your database credentials and other configuration options:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campushub
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=yoursecretkey
JWT_EXPIRES_IN=7d
PORT=5000
```

```sh
# Run database migrations
yarn migrate

# Start the backend server
yarn dev
```

#### 3. Set up the frontend
```sh
cd ../frontend

# Install dependencies
yarn install

# Create a .env file
cp .env.example .env
```

Edit the `.env` file:
```
REACT_APP_API_URL=http://localhost:5000
```

```sh
# Start the frontend development server
yarn start
```

The frontend will start on `http://localhost:3000`, and the backend will run on `http://localhost:5000`.

## Database Schema

The system uses the following core models:
- **Users:** Student and teacher account information
- **Courses:** Course details and metadata
- **CourseVideos:** Video content for each course
- **Enrollments:** Student enrollments in courses
- **StudentProgress:** Detailed tracking of student progress per video
- **Posts:** Social media content
- **Comments:** Interactions on posts
- **Friends:** User connections
- **Messages:** Chat communications

## API Documentation

The API follows RESTful principles with the following main endpoints:

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/profile` - Get the current user's profile

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create a new course (teacher only)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update a course (teacher only)
- `DELETE /api/courses/:id` - Delete a course (teacher only)
- `POST /api/courses/:id/enroll` - Enroll in a course

### Social
- `GET /api/posts` - Get social media posts
- `POST /api/posts` - Create a new post
- `GET /api/friends` - List user's friends
- `POST /api/friends/request` - Send a friend request

## Contributing
Contributions are welcome! Follow these steps:
1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Create a Pull Request

## License
This project is licensed under the MIT License.

---
<<<<<<< HEAD
Developed by **Abel Sirak Kebede** 🚀 
=======
Developed by **Abel Sirak Kebede** 🚀 
>>>>>>> bb52ff8 (full complet code no error)
