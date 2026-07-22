import { v2 as cloudinary } from 'cloudinary';


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNARY_API_KEY, 
        api_secret: process.env.CLOUDNARY_API_SECRET
    }); 


    const uploadOnCloudinary = async(localFilePath)=>{
        try {
            if(!localFilePath) return null
            const res=await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            console.log("File uploaded successfully:",res.url)
            return res
        } catch (error) {
            fs.unlinkSync(localFilePath) 
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
