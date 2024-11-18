import vine from "@vinejs/vine";
import { CustomErrorReporter } from "./CustomErrorReporter.js";

vine.errorReporter = () => new CustomErrorReporter();

// Validation schema for creating or updating skills
export const CreateOrUpdateSkillsSchema = vine.object({
  user_id: vine.string(), // User ID is mandatory
  skills: vine.array(vine.string()), // Array of skills is required
});

// Validation schema for creating or updating resume
export const UpdateOrCreateResumeSchema = vine.object({
  user_id: vine.string(), // User ID is mandatory
});
