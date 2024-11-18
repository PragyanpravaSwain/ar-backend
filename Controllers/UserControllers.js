import prisma from "../DB/db.config.js";
import vine, { errors } from "@vinejs/vine";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { CreateUserSchema } from "../Validations/schema/UserSchema.js";
import { UpdateUserSchema } from "../Validations/schema/UserSchema.js";
import { messages } from "@vinejs/vine/defaults";
import { s3 } from "../config/awsConfig.js";
import { generateSignedUrlFromUrl } from "../utils/s3Utils.js";

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept jpg, jpeg, or png files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
      return cb(null, true);
    }
    cb(new Error("Only jpg, jpeg, or png files are allowed"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
});

export { upload };

class UserControllers {
  static async store(req, res) {
    try {
      const body = req.body;
      const validator = vine.compile(CreateUserSchema);
      const payload = await validator.validate(body);

      // Check if user already exists
      const userExists = await prisma.user.findUnique({
        where: {
          email: payload.email,
        },
      });
      if (userExists) {
        // Check if the user is soft-deleted
        if (userExists.deleted) {
          return res.status(400).json({
            status: 400,
            message: "User is deleted, please activate the user",
          });
        } else {
          return res.status(400).json({
            status: 400,
            message: "User already exists",
          });
        }
      }

      // Check valid role or assign default role (CANDIDATE)
      if (payload.role_id) {
        const role = await prisma.role.findUnique({
          where: {
            id: payload.role_id,
          },
        });
        if (!role) {
          return res
            .status(404)
            .json({ status: 404, message: "Role not found" });
        }
      } else {
        // Assign default 'CANDIDATE' role if no role_id is provided
        const defaultRole = await prisma.role.findUnique({
          where: {
            name: "CANDIDATE",
          },
        });
        if (!defaultRole) {
          return res.status(404).json({
            status: 404,
            message: "Default 'CANDIDATE' role not found",
          });
        }
        payload.role_id = defaultRole.id; // Set default role_id
      }

      // Encrypt password
      const salt = bcrypt.genSaltSync(10);
      payload.password = bcrypt.hashSync(payload.password, salt);

      // Create the user
      const user = await prisma.user.create({
        data: payload,
      });

      return res.status(201).json({
        status: 201,
        message: "User Created Successfully",
        user,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({ errors: error.messages });
      } else {
        return res
          .status(500)
          .json({ status: 500, message: "Internal Server Error" });
      }
    }
  }

  static async getAll(req, res) {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: true,
        },
        where: {
          deleted: false,
        },
      });

      if (!users || users.length === 0) {
        return res.status(404).json({ status: 404, message: "No users found" });
      }

      return res.status(200).json({ status: 200, data: users });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

  static async getById(req, res) {
    try {
      const userId = parseInt(req.params.id);

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          role: true,
        },
      });

      if (!user) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }

      return res.status(200).json({ status: 200, data: user });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

  static async update(req, res) {
    try {
      const userId = req.params.id;
      const body = req.body;
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }
      const validator = vine.compile(UpdateUserSchema);
      const payload = await validator.validate(body);

      if (payload.role_id) {
        const role = await prisma.role.findUnique({
          where: {
            id: payload.role_id,
          },
        });
        if (!role) {
          return res
            .status(404)
            .json({ status: 404, message: "Role not found" });
        }
      }

      if (payload.password) {
        const salt = bcrypt.genSaltSync(10);
        payload.password = bcrypt.hashSync(payload.password, salt);
      }

      // Filter out null or undefined fields from payload
      const filteredPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value != null)
      );

      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...filteredPayload,
          updated_at: new Date(),
        },
      });

      return res.status(200).json({
        status: 200,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        console.log(error.messages);
        return res.status(400).json({ errors: error.messages });
      } else {
        console.log(error);
        return res
          .status(500)
          .json({ status: 500, message: "Internal Server Error" });
      }
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!user) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }

      if (user.email === "admin@igdrones.com") {
        return res
          .status(403)
          .json({ status: 403, message: "Admin user cannot be deleted" });
      }

      if (user.deleted) {
        return res
          .status(400)
          .json({ status: 400, message: "User is already deleted" });
      }

      await prisma.user.update({
        where: {
          id: Number(id),
        },
        data: {
          deleted: true,
          deleted_at: new Date(),
        },
      });

      return res
        .status(200)
        .json({ status: 200, message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  static async activateUser(req, res) {
    try {
      const { email } = req.body;

      const userExists = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!userExists) {
        return res.status(404).json({
          status: 404,
          message: "User not found",
        });
      }

      if (!userExists.deleted) {
        return res.status(400).json({
          status: 400,
          message: "User is already active",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: {
          deleted: false,
          deleted_at: null,
        },
      });

      return res.status(200).json({
        status: 200,
        message: "User reactivated successfully",
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  // Add or update avatar
  static async uploadAvatar(req, res) {
    try {
      // Validate if the user is authenticated, and get userId from request
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

      // Generate a unique filename for the image to avoid conflicts
      const fileName = `${uuidv4()}${path
        .extname(req.file.originalname)
        .toLowerCase()}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME, // Your AWS S3 bucket name
        Key: `avatars/${fileName}`, // File path in S3
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      const s3Response = await s3.upload(uploadParams).promise();

      // Store the avatar URL in the user's record
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar_url: s3Response.Location,
        },
      });

      const url = await generateSignedUrlFromUrl(s3Response.Location);

      return res.status(200).json({
        status: 200,
        message: "Avatar updated successfully",
        avatar_url: url,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

  // Endpoint to get current user's details with signed avatar URL
  static async getMe(req, res) {
    try {
      const userId = req.user.userId; // Assume the user ID is passed in the request (auth middleware should populate this)

      // Fetch the user from the database (you can modify the fields as needed)
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar_url: true, // Get the avatar URL field
          role: true,
        },
      });

      if (!user) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }

      // If the user has an avatar_url, generate a signed URL
      if (user.avatar_url) {
        const signedUrl = await generateSignedUrlFromUrl(user.avatar_url);
        user.avatar_url = signedUrl; // Replace the avatar_url with the signed URL
      }

      // Return the user's details along with the signed avatar URL (if available)
      return res.status(200).json({
        status: 200,
        message: "User details fetched successfully",
        user,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }
}

export default UserControllers;
