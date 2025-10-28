import asyncheadler from "../utils/asynchedler.js";
import { ApiError } from "../utils/apierror.js";
import {User} from "../models/user.model.js"
import { uploadcloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
const registeruser = asyncheadler( async (req,res) => {
    // res.status(300).json({
    //     message: "Chai aur code"
    // }) This Is For Demo Of Contorler And ro//


    //Now We actually Write user
    // First we get user details from fortend 
    const {username,email,fullname,password} = req.body
    // console.log(req.body);
    // console.log("Email :",email);
    // console.log("Fullname :",fullanme);
    // console.log("Username :",username);
    // console.log("Password :",password);
    // now varfiy all details - Any rquried not exites
    // if(email === ""){
    //     throw new ApiError(400,"Email Must BR required");
    // }

    if(
        [fullname,email,username,password].some((field) => field?.trim() == "")
    ){
        throw new ApiError(400,"All Requird Details Must be included");
    }

    // check user is already login or not :- username and email
    const exiteduser = await User.findOne({
        $or: [ 
            { email:email }
            ,{ username:username }]
        })
        if(exiteduser){
            throw new ApiError(409,"USername Or Email is already exits")
        }

    // check avtar and coverimage is inclued or not
    const avatarlocalpath = req.files?.avatar[0]?.path;
    // const coverimagelocalpath = req.files?.coverImage[0]?.path;
    // console.log("avatar",req.files.avatar);
    // console.log("coverimage",req.files.coverImage[0]);
    let coverimagelocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverimagelocalpath = req.files?.coverImage[0]?.path;
    }
    if(!avatarlocalpath) throw new ApiError(400,"Avtar Image Most Be included");
    // if exits then uplode in clodinary, avter 
    const avatar = await uploadcloudinary(avatarlocalpath);
    const coverimage = await uploadcloudinary(coverimagelocalpath);
    // console.log("avatar",avatar);
    // console.log("coverimage",coverimage);
    if(!avatar) throw new ApiError(400,"Avtar Image Most Be included") ;

    // creat user object for mogoDb data base and save in db
    const user = await User.create({
        avatar: avatar.url ,
        fullname,
        email,
        coverimage: coverimage?.url || "",
        username : username.toLowerCase(),
        password
    })

    // remove password and refresh token field form response
   const createduser = await User.findById(user._id).select(
    "-password -refreashToken"
   );

    // check for user cration  exits or not
    if(!createduser) throw new ApiError(500,"Something Went Wrong While registering user");
    // if exits then return response else throw error 
    return res.status(201).json(
        new ApiResponse(
            200,
            createduser,
            "User Registered Successfully"
        )
    ) 
})

// Creat One Method Which create access token and refres token
const generateAccessAndRefreshToken  = async(userid) => {
    try {
        const user = await User.findById(userid);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        return { 
            accessToken, 
            refreshToken 
        };
    } 
    catch (error) {
        console.log("Token generation error:", error);
        throw new ApiError(500,"Somthing Went Worng While genreting The AccesToken And RefresToken");
    }
}
const loginuser =  asyncheadler(async (req,res) => {
    // get data form rq.body
    const {email,username,password} = req.body
    // check username or Email exites or not
    if(!(username || email)){
        throw new ApiError(400,"Email or Username Not Exites pleas Register");
    }
    // find the user
    const user = await User.findOne({
        $or: [{ username: username },{ email : email }]
    })
    // check the password 
    if(!user){
        throw new ApiError(404,"User is Not Exites");
    }
    // password correct Then Login
    let isvalided = false;
    try {
        isvalided = await user.isPasswordCorrect(password);
    } catch (error) {
        throw new ApiError(401,"Your Password is Incorrect Try Another Password");    
    }


    // access And refrece token is send user 
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken (user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    // send cookie Secure cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    // send the response
    .json(
        new ApiResponse(
            200,
            {
                loggedInUser,
                accessToken,
                refreshToken
            },
            "User Is Login Succesfully"
        )
     )
}) 
const logoutuser = asyncheadler(async(req,res) => {
    // get userid 
    await User.findByIdAndUpdate(req.user_id,
        {
            $set: {
                refreshToken: undefined
            } 
        },
        {
            new: true
        }
    )
    // cokkie clear
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200,{},"USer Logout"))
})

const refreshAccessToken = asyncheadler(async(req,res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingrefreshToken){
        throw new ApiError(401,"UnAuthorized Request")
    }
    const decode = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decode?._id);
    if(!user){
        throw new ApiError(401,"Invaild RefreshToken");
    }
    if(incomingrefreshToken !== user.refreashToken){
        throw new ApiError(401,"Refresh Token Is Expried or Does Not Match");
    }
    const options = {
        httpOnly : true,
        secure : true
    }
    const {accessToken,newrefreashToken} = await generateAccessAndRefreshToken(user._id);
    
    return res
           .status(200)
           .cookie("acceshToken",accessToken,options)
           .cookie("refreshToken",newrefreashToken,options)
           .json(
            new ApiResponse(200,
                {
                    accessToken,refreashToken : newrefreashToken
                },
                "AccesshToken Refreshed Withour Erorr"
            )
           )
})
export {
    registeruser,
    loginuser,
    logoutuser,
    refreshAccessToken
} 
    