import { Router } from "express";
import {
  registerUser,
  loginuser,
  logoutuser,
  refreshaccesstoken,
  getcurrentuser,
  updateavatar,
  updatecover,
  updatepassword,
  updateprofile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const Userrouter = Router();

Userrouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxcount: 1,
    },
    {
      name: "coverImage",
      maxcount: 1,
    },
  ]),
  registerUser,
);

Userrouter.route("/login").post(loginuser);
Userrouter.route("/logout").post(verifyJWT, logoutuser);
Userrouter.route("/refreshaccesstoken").post(refreshaccesstoken);
Userrouter.route("/updateprofile").post(verifyJWT,updateprofile);
Userrouter.route("/updatepasswrd").post(verifyJWT,updatepassword);
Userrouter.route("/updateavatar").post(verifyJWT,upload.single("avatar"),updateavatar);
Userrouter.route("/updatecover").post(verifyJWT,upload.single("coverImage"),updatecover);
Userrouter.route("/getuser").post(verifyJWT,getcurrentuser);

export { Userrouter };
