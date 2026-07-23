import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        cloudinary.config({ 
            cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
            api_key: process.env.CLOUDNARY_API_KEY, 
            api_secret: process.env.CLOUDNARY_API_SECRET
        });

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // File has been uploaded successfully
        console.log("File uploaded successfully:", response.url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation failed
        }
        return null;
    }
}

    const deleteFromCloudinary=async(public_id)=>{
        try {
            if(!public_id) return null
            const res=await cloudinary.uploader.destroy(public_id)
            console.log("File deleted successfully:",res.result)
            return res
        } catch (error) {
            return null;
        }
    }   

    export {uploadOnCloudinary,deleteFromCloudinary}
