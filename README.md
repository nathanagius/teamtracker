# Team Tracker

A comprehensive team management system with Workday integration capabilities. This application allows you to manage team hierarchies, track team members, skills, capabilities, and maintain a complete audit trail of all changes.

## Features

### Core Functionality

- **Team Management**: Create, update, and delete teams
- **User Management**: Add, remove, and manage team members
- **Team Hierarchy**: Define and visualize team reporting structures
- **Skills Tracking**: Manage individual and team skills with proficiency levels
- **Capabilities Management**: Track team capabilities and strength levels
- **Availability Tracking**: Monitor team member availability and status
- **Change Management**: Request, approve, and track team changes
- **Audit Trail**: Complete history of all system changes

### User Roles

- **Engineering Manager**: Team leadership and management
- **Technical Product Owner**: Product and technical direction
- **Engineer**: Technical implementation and development

### Key Features

- ✅ Create a new team
- ✅ Add a new member to a team
- ✅ Remove a member from a team
- ✅ Move a member between teams
- ✅ View the team hierarchy
- ✅ View the team members
- ✅ View the team skills
- ✅ View the team capabilities
- ✅ Auditing of team changes
- ✅ Approval of team changes
- ✅ Team member skills and capabilities
- ✅ Team member availability

## Technology Stack

### Backend

- **Node.js** with Express.js
- **PostgreSQL** database
- **Docker** for containerization
- **RESTful API** architecture

### Frontend

- **React.js** with modern hooks
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Axios** for API communication

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd team-tracker
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Start the application with Docker**

   ```bash
   npm run docker-up
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Development Setup

For local development without Docker:

1. **Start the database**

   ```bash
   docker-compose up postgres -d
   ```

2. **Start the backend**

   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Start the frontend**
   ```bash
   cd client
   npm install
   npm start
   ```

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Key Endpoints

#### Teams

- `GET /teams` - Get all teams
- `GET /teams/:id` - Get team details
- `POST /teams` - Create new team
- `PUT /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team

#### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user details
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Team Members

- `GET /team-members` - Get all team members
- `GET /team-members/team/:teamId` - Get team members by team
- `POST /team-members` - Add member to team
- `PUT /team-members/:id/remove` - Remove member from team
- `PUT /team-members/:id/move` - Move member between teams

#### Skills

- `GET /skills` - Get all skills
- `POST /skills` - Create new skill
- `POST /skills/user/:userId` - Add skill to user
- `PUT /skills/user/:userId/:skillId` - Update user skill

#### Capabilities

- `GET /capabilities` - Get all capabilities
- `POST /capabilities` - Create new capability
- `POST /capabilities/team/:teamId` - Add capability to team

#### Changes & Approvals

- `GET /changes` - Get all change requests
- `POST /changes` - Create change request
- `PUT /changes/:id/approve` - Approve change request
- `PUT /changes/:id/reject` - Reject change request

#### Audit

- `GET /audit` - Get audit logs
- `GET /audit/summary` - Get audit summary
- `GET /audit/recent` - Get recent audit activity

## Database Schema

The application uses PostgreSQL with the following main tables:

- **teams**: Team information and metadata
- **users**: User profiles and roles
- **team_members**: Team membership relationships
- **skills**: Available skills in the system
- **user_skills**: User skill associations with proficiency levels
- **capabilities**: Team capabilities
- **team_capabilities**: Team capability associations
- **user_availability**: User availability status
- **team_hierarchy**: Team reporting relationships
- **change_requests**: Pending and processed change requests
- **audit_log**: Complete audit trail

## Project Structure

```
team-tracker/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── routes/            # API route handlers
│   ├── db/                # Database initialization
│   └── index.js           # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
├── docker-compose.yml     # Docker configuration
└── package.json           # Root package.json
```

## Usage

### Managing Teams

1. Navigate to the Teams page
2. Click "Create Team" to add a new team
3. Fill in team name and description
4. View team details to manage members and capabilities

### Managing Users

1. Go to the Users page
2. Click "Add User" to create a new user
3. Assign roles and team memberships
4. Add skills and track availability

### Team Hierarchy

1. Visit the Hierarchy page
2. View the current team structure
3. Create parent-child relationships between teams
4. Visualize the organizational structure

### Change Management

1. Navigate to Changes page to view all requests
2. Go to Approvals page to review pending changes
3. Approve or reject change requests
4. Track the complete approval workflow

### Skills & Capabilities

1. Manage skills in the Skills page
2. Assign skills to users with proficiency levels
3. Define team capabilities in the Capabilities page
4. Track team strength levels for different capabilities

## Development

### Adding New Features

1. Create API routes in `server/routes/`
2. Add corresponding frontend pages in `client/src/pages/`
3. Update the navigation in `client/src/components/Layout.js`
4. Add API service methods in `client/src/services/api.js`

### Database Changes

1. Update the schema in `server/db/init.sql`
2. Add any necessary migrations
3. Update API routes to handle new data structures

### Styling

The application uses Tailwind CSS. Custom styles can be added to:

- `client/src/index.css` for global styles
- Component-specific classes for local styling

## Deployment

### Production Setup

1. Update environment variables for production
2. Build the frontend: `cd client && npm run build`
3. Use a production database
4. Set up proper logging and monitoring
5. Configure reverse proxy (nginx recommended)

### Environment Variables

- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.
