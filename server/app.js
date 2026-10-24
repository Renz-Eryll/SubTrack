import express from "express";
import helmet from "helmet";
import { PORT } from "./config/env.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import workflowRouter from "./routes/workflow.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import arcjetMiddleware from "./middlewares/arcjet.middleware.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({ name: "SubTrack API", version: "v1", docs: "https://github.com/Renz-Eryll/SubTrack" });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok" });
});

// Reuse one database connection across requests (and warm serverless invocations).
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Upstash calls this from its own servers and verifies the request signature,
// so it sits before Arcjet's bot detection.
app.use("/api/v1/workflows", workflowRouter);

app.use(arcjetMiddleware);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorMiddleware);

// On Vercel the app is exported as a function; locally it runs as a regular server.
if (!process.env.VERCEL) {
  const port = PORT || 5500;
  app.listen(port, () => {
    console.log(`SubTrack API running on http://localhost:${port}`);
  });
}

export default app;
