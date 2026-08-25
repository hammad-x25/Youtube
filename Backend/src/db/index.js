import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import "../config/env.js";

export const getDatabaseUri = (configuredUrl, databaseName = DB_NAME) => {
    const fallbackUrl = "mongodb://127.0.0.1:27017";
    const sourceUrl = (configuredUrl || fallbackUrl).trim();

    if (!sourceUrl.startsWith("mongodb://") && !sourceUrl.startsWith("mongodb+srv://")) {
        throw new Error("MONGODB_URL must start with mongodb:// or mongodb+srv://");
    }

    const queryIndex = sourceUrl.indexOf("?");
    const baseUrl = queryIndex === -1 ? sourceUrl : sourceUrl.slice(0, queryIndex);
    const query = queryIndex === -1 ? "" : sourceUrl.slice(queryIndex);
    const hasDatabase = baseUrl.slice(baseUrl.indexOf("://") + 3).includes("/");

    if (hasDatabase && baseUrl.endsWith("/")) {
        return `${baseUrl}${databaseName}${query}`;
    }

    if (hasDatabase) {
        return `${baseUrl}${query}`;
    }

    return `${baseUrl}/${databaseName}${query}`;
};

export const DBconnect = async () => {
    try {
        const databaseUrl = getDatabaseUri(process.env.MONGODB_URL, process.env.MONGODB_DB_NAME || DB_NAME);
        const databaseinstance = await mongoose.connect(databaseUrl, {
            serverSelectionTimeoutMS: 10_000,
            maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
        });
        console.log("Database connected:", databaseinstance.connection.host);
        return databaseinstance;
    } catch (error) {
        console.error("Database connection failed:", error.message);
        throw error;
    }
};
