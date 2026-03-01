/**
 * Express application instance configured with CORS, authentication, and API routing.
 * Sets up middleware for cross-origin requests, Better Auth handler, JSON parsing, and initializes API routes.
 */
import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes/index";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";

const app = express();

// Global middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

// Serve uploaded files
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api", routes);

export default app;
