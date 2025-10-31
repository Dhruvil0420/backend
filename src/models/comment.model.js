import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const commentSchema = new mongoose.Schema({
    id :{
        type: Number,
        required: true,
        Unique: true
    },
    content:{
        type: String,
        required: true
    },
    video:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
},{timestamps: true});

commentSchema.plugin(mongooseAggregatePaginate);
export const comment = mongoose.model("Comment",commentSchema);