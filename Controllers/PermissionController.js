import prisma from "../DB/db.config.js";
import vine, { errors } from "@vinejs/vine";
import { messages } from "@vinejs/vine/defaults";
import { NameDescriptionSchema } from "../Validations/schema/CommonSchema.js";

class PermissionsController {
  static async getAll(req, res) {
    try {
      const permissions = await prisma.permission.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
      });
      return res.status(200).json({
        status: 200,
        message: "Permissions fetched successfully",
        permissions,
      });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

  // Fetch logged-in user's permissions
  static async getMyPermissions(req, res) {
    try {
      const userRole = req.user.role; // Assuming `req.user` is set by middleware
      const role = await prisma.role.findUnique({
        where: { id: userRole.id },
      });

      if (!role) {
        return res.status(404).json({ status: 404, message: "Role not found" });
      }

      const currentRolePermissions = await prisma.role_has_permissions.findMany(
        {
          where: {
            role_id: role.id,
            deleted: false, // Exclude soft-deleted permissions
          },
          include: {
            permission: true,
          },
        }
      );

      const permissions = currentRolePermissions.map(
        (role_has_permission) => role_has_permission.permission.name
      );

      return res.status(200).json({
        status: 200,
        message: "User permissions fetched successfully",
        permissions: permissions,
      });
    } catch (e) {
      console.error("Error fetching user permissions:", e);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }
}

export default PermissionsController;
