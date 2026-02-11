import express from "express";
import cors from "cors";
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

app.use("/api", routes);

export default app;
