import { Router } from "express";
import AuthControllers from "../Controllers/AuthController.js";

const authApiRouter = Router();

authApiRouter.post("/login", AuthControllers.login);
authApiRouter.post("/refress-token", AuthControllers.refreshToken);

export default authApiRouter;
