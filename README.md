# Play Match App

A full-stack sports activity matching platform built with React and Express.js. Users can discover, host, and join local activities, manage participants, and track attendance.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Getting Started

### 1. Clone the repository

```bash
gh repo clone IS3108-Project/play-match-app
cd play-match-app
```

> Make sure to install the [GitHub CLI](https://cli.github.com/) before running this command.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # fill in the values (ask a teammate for the secrets)
npm install            # installs deps + auto-generates Prisma client
npm run db:migrate     # applies pending database migrations (skip if using shared DB)
npm run dev            # starts backend on http://localhost:3000
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev            # starts frontend on http://localhost:5173
```

### After pulling new changes

```bash
cd backend
npm install            # regenerates Prisma client if schema changed
npm run db:migrate     # only needed if new migration files were added
npm run dev
```

## Available Scripts

### Backend

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot reload |
| `npm run db:migrate` | Apply pending Prisma migrations          |
| `npm run db:generate`| Regenerate Prisma client                 |
| `npm run db:studio`  | Open Prisma Studio (DB GUI)              |

### Frontend

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run lint`    | Run ESLint               |
| `npm run preview` | Preview production build |

## Tech Stack

- **Frontend**: React, TypeScript, Vite, shadcn/ui, Tailwind CSS, React Router
- **Backend**: Express.js, TypeScript, Prisma, Better Auth, Resend
- **Database**: PostgreSQL (Neon serverless)
