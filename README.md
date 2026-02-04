# Play Match App

A full-stack application with a React frontend and Express.js backend.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Getting Started

### 1. Clone the repository

```bash
gh repo clone IS3108-Project/play-match-app (Make sure to install the GitHub CLI from https://cli.github.com/ before running this command)
cd play-match-app
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:3000` (or your configured port).

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Available Scripts

### Backend

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `npm run dev` | Start development server with hot reload |

### Frontend

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run lint`    | Run ESLint               |
| `npm run preview` | Preview production build |

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express.js, TypeScript, Node.js
