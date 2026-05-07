import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return true;
};

const uploadBufferOnCloudinary = async (fileBuffer) => {
  try {
    if (!fileBuffer) return null;
    if (!configureCloudinary()) return null;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        },
      );

      stream.end(fileBuffer);
    });

    console.log("file has been uploaded on cloudinary", result.url);
    return result;
  } catch (error) {
    console.error("Cloudinary buffer upload failed:", error?.message || error);
    return null;
  }
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    if (!configureCloudinary()) return null;
    const absoluteFilePath = path.resolve(localFilePath);

    if (!fs.existsSync(absoluteFilePath)) {
      console.error(
        "Local file not found for Cloudinary upload:",
        absoluteFilePath,
      );
      return null;
    }

    const result = await cloudinary.uploader.upload(absoluteFilePath, {
      resource_type: "auto",
    });
    console.log("file has been uploaded on cloudinary", result.url);
    return result;
  } catch (error) {
    console.error("Cloudinary path upload failed:", error?.message || error);
    return null;
  } finally {
    // Also cleanup after successful upload to avoid temp file buildup.
    const absoluteFilePath = localFilePath ? path.resolve(localFilePath) : null;
    if (absoluteFilePath && fs.existsSync(absoluteFilePath)) {
      await fs.promises.unlink(absoluteFilePath);
    }
  }
};

export { uploadOnCloudinary, uploadBufferOnCloudinary };
// cloudinary.v2.uploader
//   .upload("dog.mp4", {
//     resource_type: "video",
//     public_id: "my_dog",
//     overwrite: true,
//     notification_url: "https://mysite.example.com/notify_endpoint",
//   })
//   .then((result) => console.log(result));
