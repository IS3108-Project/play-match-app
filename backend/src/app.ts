import express from "express";
import cors from "cors";
import routes from "./routes/index";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("/api/auth/*", toNodeHandler(auth));

app.use("/api", routes);

export default app;
