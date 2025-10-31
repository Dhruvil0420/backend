import mongoose from "mongoose";

const playlistSchema = mongoose.Schema({
    id:{
        type:Number,
        required : true, 
        uniqe: true,
    },
    name:{
        type: String,
        required: true,
    },
    vidoes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: true
        }
    ],
    diescripation:{
        type: String,
        required: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true});

export const PlayList = mongoose.model("PlayList",playlistSchema)