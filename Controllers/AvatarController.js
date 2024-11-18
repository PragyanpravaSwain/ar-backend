import prisma from "../DB/db.config.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/aws.js"; // Import the s3 client from config

class AvatarController {
  static async getAvatar(req, res) {
    try {
      const userId = req.user.userId; // Assume the user ID is passed in the URL

      // Fetch user details from the database to get the avatar_url
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });

      if (!user || !user.avatar_url) {
        return res
          .status(404)
          .json({ status: 404, message: "Avatar not found" });
      }

      // Extract the file path from avatar_url (for example, "avatars/abc.png")
      const filePath = user.avatar_url.split("/").slice(3).join("/"); // remove the base URL part

      // Generate a signed URL
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME, // your S3 bucket name
        Key: filePath, // The path of the file in S3
        Expires: 3600, // URL will expire in 1 hour
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      // Return the signed URL
      return res.status(200).json({
        status: 200,
        message: "File served successfully",
        avatarUrl: signedUrl, // The signed URL
      });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }
}

export default AvatarController;
