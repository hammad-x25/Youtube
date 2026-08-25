# Frame video platform

Frame is a MERN video application with a modular Express/Mongoose API and a React/Vite client.

## Run locally

1. Start MongoDB on `mongodb://127.0.0.1:27017`.
2. Configure `Backend/.env` with `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, token expiries, and Cloudinary credentials for uploads.
3. Run the API from `Backend/` with `npm.cmd run dev`.
4. Run the client from `Frontend/` with `npm.cmd run dev`.

The API listens on port `8000` by default and exposes `GET /health`. The Vite dev server proxies `/api` to it.
