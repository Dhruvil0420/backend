import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apierror.js";
import asyncheadler from "../utils/asynchedler.js";
import jwt from 'jsonwebtoken'
export const verifyJWt = asyncheadler(async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","");
        if(!token){
            throw new ApiError(401,"Unauthorization Requset");
        }
        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECERT);
        const user = await User.findById(decoded?._id).select("-password -refreashToken");
        if(!user){
            // Todo : 
            throw new ApiError(401,"Invaild Access Token")
        }
        req.user = user;
        next(); 
    } 
    catch (error) {
        throw new ApiError(401,error?.message || "Invaild Access Token ")
    }
})