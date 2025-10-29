import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { deflate } from "zlib";
import { ApiError } from "./apierror.js";

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET
    });

// upload the file Which is alredy Exits in over local Server
const uploadcloudinary = async function (localpath) {
    try {
        if(!localpath) return null;
        // try to upload on cloudinary
        const response = await cloudinary.uploader.upload(localpath,{
            resource_type:"auto"
        });
        // file is uploded succefully 
        console.log("File is uploded succefully on cloudinary",response.url);
        fs.unlinkSync(localpath);
        return response;
    } 
    catch (error) {
        // File Uploding error then remove the temprey file as uplode opretion is failed
        fs.unlinkSync(localpath);
        return null;
    }
}
const deletcloudinary = async function (path) {
    try {
        if(!path) return null;
        const response = await cloudinary.uploader.destroy(path);
        if (response.result === "ok") {
            console.log(" Old file deleted successfully:", path);
        } 
        else if (response.result === "not found") {
            console.warn(" Image not found on Cloudinary:", path);
        } 
        else {
            console.error("Cloudinary deletion failed:", response);
        }
        return response;
    } 
    catch (error) {
        throw new ApiError(400,"Error While Deleting Old Image on cloudinary")
    }
    
}

export {uploadcloudinary,deletcloudinary};