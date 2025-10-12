import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const UserShcema = mongoose.Schema({
    username:{
        type : String,
        required : true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type : String,
        required : true,
        unique: true,
        lowercase: true, 
        trim: true
    },
    fullname:{
        type : String,
        required : true,
        trim: true, 
        index:true
    },
    avatar: {
        type: String, // cloudinary url
        required: true
    },
    coverImage: {
        type: String, // cloudinary url
    },
    wathHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    password:{
        type:String,
        required: true,
        unique:[true,"Password Is required"],
    },
    refreashToken:{
        type: String,
    }

},{timestamps: true});

UserShcema.pre("save", async function (next){
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password,10);
    next();
})

UserShcema.methods.isPasswordCorrect = 
async function (password) {
   return await bcrypt.compare(password,this.password)
}
UserShcema.methods.generateAccessToken = 
async function () {
    return jwt.sign(
    {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECERT,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

UserShcema.methods.generateRefreshToken = 
async function () {
    return jwt.sign(
    {
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)  
}
export const user = mongoose.Model("User",UserShcema);