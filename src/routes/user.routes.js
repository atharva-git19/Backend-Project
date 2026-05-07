import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    //adding multer middleware to upload files before registering user
    { name: "avatar", maxcount: 1 },
    { name: "coverImage", maxcount: 1 },
  ]),
  registerUser,
);

export default userRouter;
