import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

const hasCloudinaryConfig =
  Boolean(env.cloudinaryCloudName) &&
  Boolean(env.cloudinaryApiKey) &&
  Boolean(env.cloudinaryApiSecret);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

export const uploadTradeChart = async (file: Express.Multer.File) => {
  if (!hasCloudinaryConfig) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinaryFolder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload did not return a secure URL."));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(file.buffer);
  });
};
