import prisma from "../DB/db.config.js";
import {
  CreateOrUpdateSkillsSchema,
  UpdateOrCreateResumeSchema,
} from "../Validations/schema/SkillsSchema.js";
import vine, { errors } from "@vinejs/vine";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import s3Client from "../config/aws.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/awsConfig.js";
import { generateSignedUrlFromUrl } from "../utils/s3Utils.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf") {
      return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
});
export { upload };

class SkillsController {
  // Update or Create Skills
  static async upsertSkills(req, res) {
    try {
      const body = req.body;

      // Validate request payload
      const validator = vine.compile(CreateOrUpdateSkillsSchema);
      const payload = await validator.validate(body);

      const skills = await prisma.skills.upsert({
        where: { user_id: payload.user_id },
        create: {
          user_id: payload.user_id,
          skills: payload.skills,
        },
        update: {
          skills: payload.skills,
          updated_at: new Date(),
        },
      });

      res.status(200).json({
        status: 200,
        message: "Skills updated or created successfully",
        skills,
      });
    } catch (error) {
      console.error("Error upserting skills:", error);
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({ errors: error.messages });
      } else {
        return res
          .status(500)
          .json({ status: 500, message: "Internal Server Error" });
      }
    }
  }

  // Update or Create Resume
  static async uploadResume(req, res) {
    try {
      // Validate user authentication and file presence
      const userId = req.user.id; // Assuming `req.user.id` contains the authenticated user's ID

      if (!req.file) {
        return res
          .status(400)
          .json({ status: 400, message: "No file uploaded" });
      }

      const user = await prisma.user.findFirst({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }

      // Generate a unique filename for the resume
      const fileName = `resumes/${uuidv4()}${path
        .extname(req.file.originalname)
        .toLowerCase()}`;

      // Upload the resume to S3
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName, // File path in S3
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      const s3Response = await s3.upload(uploadParams).promise();

      const resumeUrl = s3Response.Location;

      // Update or create the skills entry with the resume URL
      const updatedSkills = await prisma.skills.upsert({
        where: { user_id: user.id },
        create: {
          user_id: user.id,
          resume_url: resumeUrl,
        },
        update: {
          resume_url: resumeUrl,
          updated_at: new Date(),
        },
      });

      // Optionally, generate a signed URL if required
      const signedUrl = await generateSignedUrlFromUrl(s3Response.Location);

      return res.status(200).json({
        status: 200,
        message: "Resume uploaded successfully",
        resume_url: signedUrl || resumeUrl, // Use signed URL if generated
      });
    } catch (error) {
      console.error("Error uploading resume:", error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

  // Get Skills
  static async getSkills(req, res) {
    try {
      const userId = req.user.userId;

      const skills = await prisma.skills.findFirst({
        where: { user_id: userId },
      });

      if (!skills) {
        return res.status(404).json({
          status: 404,
          message: "Skills not found for this user",
        });
      }

      skills.resume_url = await generateSignedUrlFromUrl(skills.resume_url);

      res.status(200).json({ status: 200, skills });
    } catch (error) {
      console.error("Error fetching skills:", error);
      res
        .status(500)
        .json({ status: 500, message: "Internal Server Error", error });
    }
  }
}

export default SkillsController;
