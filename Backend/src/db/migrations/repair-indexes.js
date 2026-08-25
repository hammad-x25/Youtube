import "../../config/env.js";
import mongoose from "mongoose";
import { getDatabaseUri } from "../index.js";

const likeIndexes = [
  {
    name: "Likedby_1_Video_1",
    key: { Likedby: 1, Video: 1 },
    options: {
      unique: true,
      partialFilterExpression: { Video: { $exists: true } },
    },
  },
  {
    name: "Likedby_1_comment_1",
    key: { Likedby: 1, comment: 1 },
    options: {
      unique: true,
      partialFilterExpression: { comment: { $exists: true } },
    },
  },
  {
    name: "Likedby_1_tweet_1",
    key: { Likedby: 1, tweet: 1 },
    options: {
      unique: true,
      partialFilterExpression: { tweet: { $exists: true } },
    },
  },
];

const dropIfPresent = async (collection, indexName) => {
  try {
    await collection.dropIndex(indexName);
  } catch (error) {
    if (!["IndexNotFound", "NamespaceNotFound"].includes(error.codeName)) throw error;
  }
};

await mongoose.connect(
  getDatabaseUri(process.env.MONGODB_URL, process.env.MONGODB_DB_NAME),
  { serverSelectionTimeoutMS: 10_000 },
);

try {
  const users = mongoose.connection.db.collection("users");
  const likes = mongoose.connection.db.collection("likes");

  await dropIfPresent(users, "fullName_1");

  for (const index of likeIndexes) {
    await dropIfPresent(likes, index.name);
    await likes.createIndex(index.key, { ...index.options, name: index.name });
  }

  console.log("Repaired user and like indexes successfully");
} finally {
  await mongoose.disconnect();
}
