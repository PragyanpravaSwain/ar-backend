import prisma from "../DB/db.config.js";

const authorizePermission = (requiredPermission) => {
  return async (req, res, next) => {
    const user = req.user;

    try {
      const permissions = await prisma.role_has_permissions.findMany({
        where: { role_id: user.role.id },
        select: { permission: true },
      });

      const userPermissions = permissions.map((perm) => {
        return perm.permission.name;
      });

      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          message: "Forbidden: You do not have the required permission",
        });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

export default authorizePermission;
