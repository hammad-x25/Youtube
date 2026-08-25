import "./config/env.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { Userrouter } from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/likes.routes.js";
import subscriptionRouter from "./routes/subscribe.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || configuredOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Origin is not allowed by CORS"));
        },
        credentials: true,
    })
);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        service: "youtube-api",
        database: req.app.locals.databaseState || "starting",
        timestamp: new Date().toISOString(),
    });
});

app.use(express.json({
    limit: "16kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public", { maxAge: "1h" }));

app.use(cookieParser());




app.use(
    "/api/v1/users",
    Userrouter
);

app.use(
    "/api/v1/videos",
    videoRouter
);

app.use(
    "/api/v1/comments",
    commentRouter
);

app.use(
    "/api/v1/likes",
    likeRouter
);

app.use(
    "/api/v1/subscriptions",
    subscriptionRouter
);

app.use(
    "/api/v1/playlists",
    playlistRouter
);

app.use(
    "/api/v1/tweets",
    tweetRouter
);

app.use(
    "/api/v1/dashboard",
    dashboardRouter
);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Route not found",
        path: req.originalUrl,
    });
});



app.use(errorHandler);


export { app };
