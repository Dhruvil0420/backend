import { Router } from "express";
import {registeruser, loginuser,logoutuser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccuontDetails, updateAvatar, updatecoverImage, creatPorfile, wathcHistory } from "../controllers/User.controller.js";
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

router.route("/logout").post(verifyJWt,logoutuser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/chang-password").post(verifyJWt,changeCurrentPassword);
router.route("/current-user").get(verifyJWt,getCurrentUser);
router.route("/update-account").patch(verifyJWt,updateAccuontDetails);
router.route("/avatar").patch(verifyJWt,updateAvatar);
router.route("/coverimage").patch(verifyJWt,updatecoverImage);
router.route("/c/:username").get(verifyJWt,creatPorfile);
router.route("/history").get(verifyJWt,wathcHistory);
export default router;