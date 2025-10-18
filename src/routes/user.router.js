import { Router } from "express";
import registeruser from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.model.js";
const userrouter = Router();

userrouter.route("/register").post(
    upload.fields([
        {
            name: "avtar",
            maxCount : 1
        },
        {
            name: "coverimage",
            maxCount : 1
        }
    ]),
    registeruser)
export default userrouter;