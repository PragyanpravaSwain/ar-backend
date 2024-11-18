import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/aws.js";

export const generateSignedUrlFromUrl = async (avatarUrl) => {
  try {
    if (!avatarUrl || typeof avatarUrl !== "string") {
      throw new Error("Avatar URL must be a valid string");
    }

    const s3BaseUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (!avatarUrl.startsWith(s3BaseUrl)) {
      throw new Error("Invalid avatar URL format or base URL mismatch");
    }

    const filePath = avatarUrl.replace(s3BaseUrl, "");
    console.log("Extracted file path:", filePath);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    console.log("Generated signed URL:", signedUrl);

    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error.message);
    throw error;
  }
};
