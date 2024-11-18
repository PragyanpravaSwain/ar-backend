import bcrypt from "bcryptjs";
import prisma from "../DB/db.config.js";
import { UserLoginSchema } from "../Validations/schema/UserSchema.js";
import vine, { errors } from "@vinejs/vine";
import jwt from "jsonwebtoken";

class AuthControllers {
  static async login(req, res) {
    try {
      const body = req.body;
      const validator = vine.compile(UserLoginSchema);
      const payload = await validator.validate(body);

      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: {
          role: true,
        },
      });

      if (!user)
        return res.status(404).json({ status: 404, message: "User not found" });

      const isMatch = await bcrypt.compareSync(payload.password, user.password);
      if (!isMatch)
        return res
          .status(401)
          .json({ status: 401, message: "Invalid credentials" });

      //Issue JWT Token to User
      const payloadData = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: { id: user.role.id, name: user.role.name },
      };
      const token = jwt.sign(payloadData, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      const refreshToken = jwt.sign(
        payloadData,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        status: 200,
        message: "Login successful",
        access_token: token,
        refresh_token: refreshToken,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        console.log(error.messages);
      } else {
        return res
          .status(500)
          .json({ status: 500, message: "Internal Server Error" });
      }
      return res.status(500).json({ errors: error.messages });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res
          .status(400)
          .json({ status: 400, message: "Refresh token is required" });
      }

      // Verify refresh token
      jwt.verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET,
        async (err, decoded) => {
          if (err)
            return res.status(403).json({
              status: 403,
              message: "Invalid refresh token",
              err: err,
            });

          // const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

          const payloadData = {
            userId: decoded.userId,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          };
          const newAccessToken = jwt.sign(payloadData, process.env.JWT_SECRET, {
            expiresIn: "24h",
          });

          return res.status(200).json({
            status: 200,
            message: "Token refreshed successfully",
            access_token: newAccessToken,
          });
        }
      );
    } catch (error) {
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }
}

export default AuthControllers;
