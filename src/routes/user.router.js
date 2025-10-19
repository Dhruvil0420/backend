import { Router } from "express";
import registeruser from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.model.js";
const userrouter = Router();

userrouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount : 1
        }
    ]),
    registeruser)
export default userrouter;