# Backend Project

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Task Management (Real-time with WebSocket)](#task-management-real-time-with-websocket)
  - [CRUD Operations](#crud-operations)
  - [Error Handling](#error-handling)
- [Database Schemas](#database-schemas)
  - [User](#user)
  - [Task](#task)
  - [Other Models](#other-models)

---

## Features

1. **JWT Authentication**:
   - Access and refresh token generation and verification.
   - Middleware to protect routes (`verifyAccessToken`).
2. **Socket.IO**:
   - Real-time event-based communication (task events: create, update, delete).
   - Configured CORS for development (`http://localhost:5173` as default).
3. **MongoDB**:
   - Uses Mongoose for schemas/models:
     - `User`, `Post`, `PostInternal`, `Category`, `Solutions`, `Gallery`, `Task`, `Otp`.
   - Demonstrates pre-save and post-save hooks.
4. **Redis**:
   - Stores refresh tokens for session management (`refreshToken` flows).
   - Provides status logging (connect, ready, error, reconnecting, end).
5. **Supabase Integration**:
   - Variables prepared for storing and retrieving images in a Supabase bucket.
6. **Routes**:
   - Authentication (`/auth`)
   - Public posts (`/posts`)
   - Internal posts (`/postinternal`)
   - Categories (`/categories`)
   - Solutions (`/solutions`)
   - Gallery (`/gallery`)
   - Admin (`/admin`)
   - User (`/user`)
   - Tasks (`/tasks`)
7. **Nodemailer Setup**:
   - Prepared environment variables for email sending.

---

## Tech Stack

- **Node.js** + **Express.js**
- **Socket.IO**
- **MongoDB** + **Mongoose**
- **Redis** for refresh token storage
- **Supabase** for image storage
- **JWT** for authentication
- **dotenv** for environment variables
- **Nodemailer** for sending emails
- **Joi** for input validation
- **Morgan** for logging HTTP requests
- **Cors** for handling cross-origin resource sharing

## Project Structure

## Setup and Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-repo-url.git
   cd your-repo-name
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and configure the following:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_NAME=admin
   REDIS_URL=redis://localhost:6379
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   SUPRABASE_URL=https://your-supabase-url.supabase.co
   SUPRABASE_KEY=your-supabase-key
   SUPRABASE_BUCKET_NAME=imgstorage
   NODEMAILER_EMAIL=your_email
   NODEMAILER_VICKY=your_nodemailer_secret
   OTP_EXPIRY=300000
   ```

4. **Generate Secrets**:
   Use the provided `keygenerator.js` to generate secure secrets for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`:

   ```bash
   node helpers/keygenerator.js
   ```

5. **Run the Application**:

   ```bash
   npm start
   ```

6. **Access the Application**:
   Visit `http://localhost:3000` in your browser or use tools like Postman to test the API.

---

## API Endpoints

### Authentication

- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Log in a user and return JWT tokens.

### Task Management (Real-time with WebSocket)

- WebSocket events:
  - `taskCreated`
  - `taskUpdated`
  - `deleteTask`

### CRUD Operations

- Posts: `/posts`, `/postinternal`
- Categories: `/categories`
- Solutions: `/solutions`
- Gallery: `/gallery`
- Users: `/user`
- Admin: `/admin`
- Tasks: `/tasks`

### Error Handling

- Non-existing routes return a `404` response with a custom message.
- Errors in the application are handled gracefully and returned with appropriate HTTP status codes.

---

## Database Schemas

### User

- Fields: `name`, `email`, `password`, `isAdmin`, `isEmployee`, etc.
- Password hashing with `bcrypt`.

### Task

- Fields: `title`, `description`, `dueDate`, `createdBy`, `tags`, `assignee`, `stage`.

### Other Models

- `Category`, `Gallery`, `Post`, `Solutions`, etc.

---
