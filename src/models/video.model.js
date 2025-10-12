import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const VideoSchema = mongoose.Schema({
    id:{
        type:Number,
        required : true, 
        uniqe: true,
    },
    videoFile:{
        type: String, // cloudinary url
        required: true,
    },
    thumbnail: {
        type: true, // cloudinary url
        required: true,
    },
    title:{
        type: true,
        required : true,
    },
    description: { // clousinary 
        type: Number,
        required: true,
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},{timestamps: true});

VideoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video",VideoSchema);