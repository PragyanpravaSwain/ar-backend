import { Router } from "express";

import RoleController from "../Controllers/RoleController.js";
import authorizePermission from "../middleware/AuthorizePermission.js";
const userApiRouter = Router();

userApiRouter.post(
  "/add",
  authorizePermission("ADD_ROLE"),
  RoleController.store
);
userApiRouter.get(
  "/all",
  authorizePermission("VIEW_ALL_ROLE"),
  RoleController.getAll
);
userApiRouter.get(
  "/:id",
  authorizePermission("VIEW_ROLE"),
  RoleController.getById
);
userApiRouter.put(
  "/:id",
  authorizePermission("EDIT_ROLE"),
  RoleController.update
);
userApiRouter.delete(
  "/:id",
  authorizePermission("DELETE_ROLE"),
  RoleController.delete
);
userApiRouter.post(
  "/set-permissions/:id",
  authorizePermission("SET_PERMISSION_TO_ROLE"),
  RoleController.setPermissionToRoles
);

export default userApiRouter;
