# Frame

Frame is a full-stack video platform for discovering, watching, publishing, and organizing community content. It combines a React client with an Express/Mongoose API, cookie-based authentication, Cloudinary media uploads, and MongoDB persistence.

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,nodejs,express,mongodb,docker,nginx" alt="React, Vite, Node.js, Express, MongoDB, Docker, and Nginx" />
</p>

## What you can do

- Browse videos with search, pagination, view tracking, and watch pages
- Create an account, sign in, refresh sessions, and update profile details
- Upload videos and thumbnails through Cloudinary-backed media handling
- Manage published videos, drafts, metadata, and thumbnails from the creator dashboard
- Like videos, comments, and tweets
- Comment on videos and edit or delete your own comments
- Follow creators and view subscribers and subscriptions
- Save videos into playlists
- Post tweets and browse a feed from followed creators
- Review watch history and liked videos in a personal library

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, React Router, Vite, Fetch API |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB / MongoDB Atlas |
| Authentication | JWT access and refresh tokens in HTTP-only cookies |
| Media | Multer for multipart uploads, Cloudinary for storage |
| Delivery | Nginx, Docker, Docker Compose |

## Repository structure

```text
.
|-- Backend/
|   |-- src/controllers/   # Request handlers and business logic
|   |-- src/models/        # Mongoose schemas
|   |-- src/routes/        # Versioned API route modules
|   |-- src/middlewares/   # Auth, uploads, and error handling
|   |-- src/db/            # Database connection and migrations
|   `-- src/index.js       # API entry point
|-- Frontend/
|   |-- src/components/    # Shared UI components
|   |-- src/pages/         # Application screens
|   |-- src/context/       # Authentication state
|   `-- src/lib/           # API client and formatters
|-- docker-compose.yml
`-- README.md
```

## Requirements

- Node.js 18 or newer
- MongoDB locally or a MongoDB Atlas connection
- Cloudinary account for video and image uploads
- Docker Desktop, if using the containerized setup

## Local development

### 1. Install dependencies

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

On Windows PowerShell, use `npm.cmd` if PowerShell does not resolve `npm` correctly.

### 2. Configure the backend

Create `Backend/.env`:

```env
NODE_ENV=development
PORT=8000

MONGODB_URL=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=Youtube

ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CORS_ORIGIN=http://localhost:5173

CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API=your-cloudinary-api-key
CLOUDINARY_SECRET_KEY=your-cloudinary-api-secret

# Optional upload controls
# UPLOAD_TEMP_DIR=public/temp
# MAX_UPLOAD_BYTES=1073741824
```

`MONGODB_URL` may be a local MongoDB URI or an Atlas `mongodb+srv://` URI. If the URI does not include a database name, the backend uses `MONGODB_DB_NAME` or the default database name `Youtube`.

For browser cookie authentication, `CORS_ORIGIN` must match the frontend origin exactly. Do not use `*` with credentialed requests.

### 3. Start the API

```bash
cd Backend
npm run dev
```

The API runs on `http://localhost:8000`. Verify it with:

```text
GET http://localhost:8000/health
```

### 4. Start the frontend

In a second terminal:

```bash
cd Frontend
npm run dev
```

The Vite client runs on `http://localhost:5173` and proxies `/api` and `/health` to the backend.

## Useful commands

### Backend

```bash
npm run dev             # Start the API with Nodemon
npm start               # Start the API normally
npm test                # Run Node's test suite
npm run migrate:indexes # Repair indexes in the configured database
```

### Frontend

```bash
npm run dev      # Start Vite development server
npm run build    # Create a production build
npm run preview  # Preview the production build locally
```

Run the index migration against the configured target database after deploying schema/index changes, especially before testing like toggles or other state-changing endpoints.

## API overview

All application routes are mounted under `/api/v1`:

| Route group | Responsibility |
| --- | --- |
| `/users` | Registration, login, sessions, profiles, history, liked videos |
| `/videos` | Discovery, upload, watch, views, publishing, and management |
| `/comments` | Create, update, and delete video comments |
| `/likes` | Toggle video, comment, and tweet likes |
| `/subscriptions` | Follow creators and manage subscribers |
| `/playlists` | Create collections and manage saved videos |
| `/tweets` | Create and manage posts and followed-user feeds |
| `/dashboard` | Creator, audience, library, and social summaries |

Protected requests use the access-token cookie. The frontend API client automatically includes credentials and attempts an access-token refresh after an authorized request expires.

## Docker

The repository includes Dockerfiles for the API and frontend plus a MongoDB-backed Compose setup:

```bash
docker compose up --build
```

The containerized frontend is served by Nginx on port `80`, while the backend is available internally on port `8000`. Provide the backend environment values through `Backend/.env` before starting Compose.

## License

This project is licensed under the ISC license.

Feel free to contribute or fork repo , Also can do Pull request for real issues.
