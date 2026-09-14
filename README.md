# Cloud Disk — Backend

REST API for a cloud file storage application. Handles authentication, file upload/download/delete, nested directories, and user avatar management. Built as the backend for [cloud-disk-front](https://github.com/your-username/cloud-disk-front).

## Features

- **Authentication** — register, login, JWT-based session restore (`/api/auth`)
- **File management** — upload, download, delete files with per-user disk quota (10 GB)
- **Directories** — create nested folders, stored as a tree in MongoDB
- **File listing** — get files by parent directory, sort by name / type / date
- **Search** — case-insensitive file search via MongoDB `$regex`
- **Avatar** — upload and delete user profile avatar

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 6 |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| File upload | `express-fileupload` |
| Validation | `express-validator` |
| Config | `config` npm package + env vars |

## Getting Started

### Prerequisites

- Node.js 14+
- MongoDB Atlas account (or local MongoDB instance)

### Install

```bash
git clone https://github.com/your-username/cloud-disk-back.git
cd cloud-disk-back
npm install
```

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
cp .env.example .env
```

Set your values in `.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/cloud-disk
JWT_SECRET=your_strong_random_secret_here
```

Optional overrides in `config/default.json`:
- `serverPort` — default `5000`
- `filePath` — folder where user files are stored, default `files`
- `staticPath` — folder for avatar images, default `static`

### Run

```bash
# development (auto-restart)
npm run dev

# production
npm start
```

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/registration` | Create account |
| POST | `/login` | Login, returns JWT |
| GET | `/auth` | Restore session by token |

### Files — `/api/files` (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List files. Query: `parent` (id), `sort` (name/type/date) |
| POST | `/` | Create directory. Body: `{ name, type: "dir", parent? }` |
| POST | `/upload` | Upload file. FormData: `file`, `parent?` |
| GET | `/download?id=` | Download file by id |
| DELETE | `/?id=` | Delete file or directory |
| GET | `/search?search=` | Search files by name |
| POST | `/avatar` | Upload avatar |
| DELETE | `/avatar` | Delete avatar |

## Project Structure

```
├── config/
│   ├── default.json                    # Non-secret defaults (port, paths)
│   └── custom-environment-variables.json  # Maps env vars to config keys
├── controllers/
│   └── fileController.js              # File operation handlers
├── middleware/
│   ├── auth.middleware.js             # JWT verification
│   ├── cors.middleware.js             # CORS headers + OPTIONS preflight
│   └── filepath.middleware.js         # Injects req.filePath
├── models/
│   ├── User.js                        # User schema (email, password, diskSpace)
│   └── File.js                        # File schema (name, type, path, parent, children)
├── routes/
│   ├── auth.routes.js                 # Registration, login, auth
│   └── file.routes.js                 # File CRUD routes
├── services/
│   └── fileService.js                 # Filesystem operations (create/delete/getPath)
└── index.js                           # Express app entry point
```
