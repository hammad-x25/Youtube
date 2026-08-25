import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const dashboardRouter = Router();
dashboardRouter.get("/", verifyJWT, getDashboard);

export default dashboardRouter;
