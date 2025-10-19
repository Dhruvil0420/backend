import asyncheadler from "../utils/asynchedler.js";
import { ApiError } from "../utils/apierror.js";
import {User} from "../models/user.model.js"
import { uploadcloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
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

export default registeruser;