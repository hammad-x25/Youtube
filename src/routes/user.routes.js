import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const Userrouter=Router()

Userrouter.route("/register").post(registerUser)

export {Userrouter}