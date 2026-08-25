import test from "node:test";
import assert from "node:assert/strict";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { getDatabaseUri } from "../db/index.js";
import { Likes } from "../models/like.models.js";
import mongoose from "mongoose";

test("apierror exposes an HTTP-compatible status code", () => {
  const error = new apierror(422, "Invalid request");
  assert.equal(error.statusCode, 422);
  assert.equal(error.success, false);
});

test("apiresponse marks successful and failed responses consistently", () => {
  assert.equal(new apiresponse(200, "ok", {}).success, true);
  assert.equal(new apiresponse(422, "invalid", {}).success, false);
});

test("database URI handling preserves Atlas paths and query parameters", () => {
  assert.equal(
    getDatabaseUri("mongodb+srv://user:pass@cluster.example.net", "Youtube"),
    "mongodb+srv://user:pass@cluster.example.net/Youtube",
  );
  assert.equal(
    getDatabaseUri("mongodb+srv://user:pass@cluster.example.net/app?retryWrites=true", "Youtube"),
    "mongodb+srv://user:pass@cluster.example.net/app?retryWrites=true",
  );
});

test("like validation accepts exactly one target without callback middleware errors", async () => {
  const like = new Likes({
    Likedby: new mongoose.Types.ObjectId(),
    Video: new mongoose.Types.ObjectId(),
  });
  await like.validate();

  const invalidLike = new Likes({ Likedby: new mongoose.Types.ObjectId() });
  await assert.rejects(
    invalidLike.validate(),
    /exactly one video, comment, or tweet/,
  );
});
