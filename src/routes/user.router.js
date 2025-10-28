import { Router } from "express";
import {registeruser, loginuser,logoutuser,refreshAccessToken } from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.model.js";
import { verifyJWt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount : 1
        }
    ]),registeruser)
router.route('/login').post(loginuser);

// secured route 

router.route("/logout").post(verifyJWt,logoutuser)
router.route("/refreshToken").post(refreshAccessToken);
export default router;