import asyncheadler from "../utils/asynchedler.js";
import { ApiError } from "../utils/apierror.js";
import {User} from "../models/user.model.js"
import { uploadcloudinary,deletcloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
        await user.save({ validateBeforeSave: false }); 
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
    // console.log(req.body);
    // console.log(req.params);
    // console.log(req.query);
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
    console.log(accessToken);
    console.log(refreshToken);
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

const refreshAccessToken = asyncheadler(async (req, res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingrefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }

    const decode = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decode?._id);
    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingrefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh Token is expired or does not match");
    }

    const options = {
        httpOnly: true,
        secure: true
    };

    const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,
                { accessToken, refreshToken: newRefreshToken },
                "Access Token refreshed successfully"
            )
        );
});


const changeCurrentPassword = asyncheadler(async(req,res) => {
    const { oldpassword, newpassword } = req.body;

  if (!oldpassword || !newpassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordCorrect = await user.isPasswordCorrect(oldpassword);
  if (!passwordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
})

const getCurrentUser = asyncheadler(async(req,res) => {
    return res.status(200)
              .json(new ApiResponse(200,req.user,"Current User Find Succesfully ::"));
})

const updateAccuontDetails = asyncheadler(async(req,res) => {
    const {fullname,email} = req.body;
    if(!(fullname && email)){
        throw new ApiError(400,"All Fileds Must Be Reqired");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname: fullname,
                email : email
            }
        },
        {new : true}).select(" -password");

        return res.status(200)
                  .json(new ApiResponse(200,user,"Account Information Update Sucessfully"));
})

const updateAvatar = asyncheadler(async(req,res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");
    const avtarlocalpath = req.file?.path;
    if(!avtarlocalpath){
        throw new ApiError(400,"Avtar is Missing ::");
    }
    // upload on clodinary
    const newavtar = await uploadcloudinary(avtarlocalpath);
    if(!newavtar.url){
        throw new ApiError(400,"Error Uploding Avtar on Cloudinary::");
    }
    // delet old iamge
    if(user.avatar){
        await deletcloudinary(user.avatar);
    } 
    // 3. Update user fields directly
    user.avatar = newavtar.url;

    // 4. Save the updated user document
    await user.save();
    user.password = undefined;
    // 5. Return success
        return res.status(200)
        .json(new ApiResponse(200,user,"Avtar Update Sucessfully"));
})

const updatecoverImage = asyncheadler(async(req,res) => {
    const coverImagelocalpath = req.file?.path;
    if(!coverImagelocalpath){
        throw new ApiError(200,"coverImage is Missing ::");
    }
    const coverImage = await uploadcloudinary(coverImagelocalpath);
    if(!coverImage.url){
        throw new ApiError(400,"Error While Uploding coverImage on clodinary");
    }
    await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            coverImage : coverImage.url
        }
    },
    {
        new : true
    })
    return res.status(200)
                  .json(new ApiResponse(200,coverImage.url,"CoverImage Update Sucessfully"));
})

const creatPorfile = asyncheadler(async (req,res) => {
    const { username } = req.params;  
    if(!username?.trim()){
        throw new ApiError(400,"User is Nor exites ");
    }
    const channel = await User.aggregate([
        {
            $match: {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id", // this id is chanle id like : Dhruvil id Which open by Jay
                foreignField : "channel",
                as: "subscribers"
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField : "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subcriberscount: { $size: "$subscribers" },
                chanlesubscribedcount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { 
                        $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },                   
        {
            $project: {
            fullname: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
            chanlesubscribedcount: 1,
            subcriberscount: 1,
            isSubscribed: 1,
            username: 1,
            createdAt: 1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"channel does not exists ");
    }
    return res.status(200)
              .json(
                new ApiResponse(200,channel[0],"User Channel fetched successfully")
              )
})

const wathcHistory = asyncheadler(async (req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as : "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner : {
                                $first: "$owner"
                            }
                        }
                    }
                ]  
            },
        },
        {
            $addFields: {
                wathcHistory : "$wathcHistory"
            }
        },
        {
            $project: {
                videoFile : 1,
                owner : 1,
                title : 1,
                description: 1,
                duration: 1,
                views : 1 ,
                description: 1,
                isPublished: 1,
                thumbnail: 1,
            }
        },
    ])
    if(!user || !user.length){
        throw new ApiError(200,"Error While Find User wathcHistory");
    }
    return res.status(200)
              .json(
                new ApiResponse(200,user[0].wathcHistory,"user wathcHistory Fetched Successfully :")
              )
})
export {
    registeruser,
    loginuser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccuontDetails,
    updateAvatar,
    updatecoverImage,
    creatPorfile,
    wathcHistory
} 
    