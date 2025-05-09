# Node.js Supabase CRUD API

A simple REST API built with Node.js and Express that connects to Supabase and performs basic CRUD operations on users.

## Features

- Create, read, update, and delete users
- Search for users by name
- Get user by email
- Error handling and proper status codes
- Environment variable configuration
- Swagger API documentation

## Tech Stack

- Node.js
- Express.js
- Supabase (PostgreSQL database)
- dotenv (for environment variables)
- CORS support
- Swagger (API documentation)

## Project Structure

```text
nodejs-supabase
├── .env                   # Environment variables
├── .example.env           # Example environment variables template
├── .gitignore             # Git ignore file
├── index.js               # Main application entry point
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation
├── config/
│   ├── supabaseClient.js  # Supabase client configuration
│   └── swagger.js         # Swagger configuration
├── controllers/
│   └── userController.js  # User controller functions
├── routes/
│   └── userRoutes.js      # API route definitions with Swagger docs
└── services/
    └── userService.js     # Business logic for user operations
```

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/manthanank/nodejs-supabase.git
    cd nodejs-supabase
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file based on the `.example.env` template and fill in your Supabase credentials:

    ```text
    SUPABASE_URL=https://your-project-url.supabase.co
    SUPABASE_KEY=your-anon-or-service-role-key
    PORT=5000
    ```

## Running the Application

Start the development server:

```bash
npm run dev
```

For production:

```bash
npm start
```

The server will run at `http://localhost:5000` by default.

## API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a new user |
| GET | `/api/users` | Get all users |
| GET | `/api/users/search?query=name` | Search users by name |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/email/:email` | Get user by email |
| PUT | `/api/users/:id` | Update user by ID |
| DELETE | `/api/users/:id` | Delete user by ID |

## Example Requests

### Create User

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'
```

### Search Users

```bash
curl -X GET http://localhost:5000/api/users/search?query=John
```

## License

[MIT](LICENSE)

## Author

Manthan Ankolekar
