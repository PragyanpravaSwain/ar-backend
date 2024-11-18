import bcrypt from "bcryptjs";
import prisma from "./DB/db.config.js";
import { permissionsList } from "./utils/permissionsList.js";

async function initializeApplication() {
  try {
    await initializePermissions(); // Initialize permissions
    await initializeAdminRole(); // Initialize roles
    await initializeAdminUser(); // Initialize admin user
    await initializeCandidateRole();
    console.log("Application initialized successfully.");
  } catch (error) {
    console.error("Error during application initialization:", error);
  }
}

async function initializePermissions() {
  try {
    const existingPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: permissionsList.map((permission) =>
            permission.name.toUpperCase()
          ),
        },
      },
    });

    const existingPermissionsMap = new Map(
      existingPermissions.map((permission) => [permission.name, permission])
    );

    const toCreate = [];
    const toUpdate = [];

    for (const permission of permissionsList) {
      permission.name = permission.name.toUpperCase();

      const existingPermission = existingPermissionsMap.get(permission.name);
      if (existingPermission) {
        if (existingPermission.description !== permission.description) {
          toUpdate.push({
            name: permission.name,
            description: permission.description,
          });
        }
      } else {
        toCreate.push(permission);
      }
    }

    if (toCreate.length > 0) {
      await prisma.permission.createMany({
        data: toCreate,
      });
      console.log(`${toCreate.length} permissions created`);
    }

    for (const permission of toUpdate) {
      await prisma.permission.update({
        where: { name: permission.name },
        data: { description: permission.description },
      });
    }

    console.log(`${toUpdate.length} permissions updated`);
  } catch (error) {
    console.error("Error initializing permissions:", error);
  }
}

async function initializeAdminRole() {
  try {
    let adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: "ADMIN",
          description: "Administrator role with all permissions",
        },
      });
    }

    const allPermissions = await prisma.permission.findMany();

    const existingRolePermissions = await prisma.role_has_permissions.findMany({
      where: {
        role_id: adminRole.id,
        deleted: false,
      },
    });

    const existingPermissionIds = existingRolePermissions.map(
      (rp) => rp.permission_id
    );

    const newPermissions = allPermissions.filter(
      (permission) => !existingPermissionIds.includes(permission.id)
    );

    if (newPermissions.length > 0) {
      await prisma.role_has_permissions.createMany({
        data: newPermissions.map((permission) => ({
          role_id: adminRole.id,
          permission_id: permission.id,
        })),
      });
    }
  } catch (error) {
    console.error("Error initializing Admin role:", error);
  }
}

async function initializeCandidateRole() {
  try {
    // Check if the CANDIDATE role already exists
    let candidateRole = await prisma.role.findUnique({
      where: { name: "CANDIDATE" },
    });

    // If the role doesn't exist, create it
    if (!candidateRole) {
      candidateRole = await prisma.role.create({
        data: {
          name: "CANDIDATE",
          description: "Candidate role with no default permissions",
        },
      });
      console.log("CANDIDATE role initialized successfully");
    } else {
      console.log("CANDIDATE role already exists");
    }
  } catch (error) {
    console.error("Error initializing CANDIDATE role:", error);
  }
}

async function initializeAdminUser() {
  try {
    const adminRoleName = "ADMIN";
    const defaultAdminEmail = "admin@prgyan.com";
    const adminRole = await prisma.role.findUnique({
      where: {
        name: adminRoleName,
      },
    });

    if (!adminRole) {
      console.log(
        `Admin role '${adminRoleName}' does not exist. Cannot create admin user.`
      );
      return;
    }

    const adminUserExists = await prisma.user.findUnique({
      where: {
        email: defaultAdminEmail,
      },
    });

    if (!adminUserExists) {
      const salt = bcrypt.genSaltSync(10);
      const password = bcrypt.hashSync("password", salt);

      const user = await prisma.user.create({
        data: {
          name: adminRoleName,
          email: defaultAdminEmail,
          password: password,
          phone: "1234567890",
          role_id: adminRole.id,
        },
      });
      console.log("Default admin user created successfully.");
      console.log("User Emai:", user.email, "Password:", "password123");
    } else {
      console.log("Default admin user already exists.");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}

export default initializeApplication;
