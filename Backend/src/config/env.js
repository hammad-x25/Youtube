import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(currentDirectory, "../../.env");

// Load the backend-local file even when the process is started from the repo root.
dotenv.config({ path: backendEnvPath });
dotenv.config();

export { backendEnvPath };
