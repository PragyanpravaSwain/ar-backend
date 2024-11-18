import { Router } from "express";
import userApi from "./userApi.js";
import roleApi from "./roleApi.js";
import permissionApi from "./permissionApi.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import authApi from "./authApi.js";
import UserControllers from "../Controllers/UserControllers.js";
import addressApi from "./addressApi.js";
import skills from "./skillsApi.js";

const router = new Router();

router.use("/auth", authApi);
router.use("/permission", authMiddleware, permissionApi);
router.use("/role", authMiddleware, roleApi);
router.post("/users/register", UserControllers.store);
router.use("/users", authMiddleware, userApi);
router.use("/address", authMiddleware, addressApi);
router.use("/skills", authMiddleware, skills);

export default router;
