import "./config/env.js";
import mongoose from "mongoose";
import { DBconnect } from "./db/index.js";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 8000;

const startServer = async () => {
  try {
    app.locals.databaseState = "connecting";
    await DBconnect();
    app.locals.databaseState = "connected";
    const server = app.listen(port, () => {
      console.log(`YouTube API listening on port ${port}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.connection.close().catch(() => {});
        process.exit(0);
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    app.locals.databaseState = "error";
    process.exitCode = 1;
  }
};

startServer();
