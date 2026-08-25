import { Router } from "express";
import {
  registerUser,
  loginuser,
  logoutuser,
  refreshaccesstoken,
  getcurrentuser,
  updatepassword,
  updateprofile,
  getuseraccountdetails,
  getwatchhistory,
  getLikedVideos
} from "../controllers/user.controller.js";

import { updateavatar, updatecover } from "../controllers/deleteold.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const Userrouter = Router();

Userrouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

Userrouter.route("/login").post(loginuser);
Userrouter.route("/logout").post(verifyJWT, logoutuser);
Userrouter.route("/refreshaccesstoken").post(refreshaccesstoken);
Userrouter.route("/updateprofile").patch(verifyJWT,updateprofile);
Userrouter.route("/updatepasswrd").patch(verifyJWT,updatepassword);
Userrouter.route("/updateavatar").patch(verifyJWT,upload.single("avatar"),updateavatar);
Userrouter.route("/updatecover").patch(verifyJWT,upload.single("coverImage"),updatecover);
Userrouter.route("/getuser").get(verifyJWT,getcurrentuser);
Userrouter.route("/getaccountdetails/:username").get(getuseraccountdetails);
Userrouter.route("/getwatchhistory").get(verifyJWT,getwatchhistory);
Userrouter.route("/liked-videos").get(verifyJWT, getLikedVideos);

export { Userrouter };
