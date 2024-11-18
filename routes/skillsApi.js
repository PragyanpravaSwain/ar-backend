import express from "express";
import SkillsController, { upload } from "../Controllers/SkillsController.js";

const router = express.Router();

// Skills routes
router.post("/skills", SkillsController.upsertSkills); // Update or Create skills
router.post("/resume", upload.single("resume"), SkillsController.uploadResume); // Update or Create resume
router.get("/", SkillsController.getSkills); // Get skills for a user

export default router;
