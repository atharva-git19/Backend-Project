import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    //adding multer middleware to upload files before registering user
    { name: "avatar", maxcount: 1 },
    { name: "coverImage", maxcount: 1 },
  ]),
  registerUser,
);

userRouter.route("/login").post(loginUser);

// secured routs

userRouter.route("/logout").post(verifyJWT, logoutUser);

export default userRouter;
