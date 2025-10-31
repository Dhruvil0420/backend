import mongoose from "mongoose";

const tweetSchema = mongoose.Schema({
    id:{
        type:Number,
        required : true, 
        uniqe: true,
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content :{
        type: String,
         required :true
    }
},{timestamps: true});

export const Tweet = mongoose.model("Tweet",tweetSchema);