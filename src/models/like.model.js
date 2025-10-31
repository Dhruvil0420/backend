import mongoose from "mongoose";
import { comment } from "./comment.model";

const likeSchema = mongoose.Schema({
    id:{
        type: Number,
        Unique: true,
        required: true
    },
    video:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },
    comment:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    twwet:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    }
},{timestamps: true});

export const Like = mongoose.model("Like",likeSchema);