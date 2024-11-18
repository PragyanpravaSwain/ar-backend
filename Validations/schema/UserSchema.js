import vine from "@vinejs/vine";
import { CustomErrorReporter } from "./CustomErrorReporter.js";

vine.errorReporter = () => new CustomErrorReporter();

export const CreateUserSchema = vine.object({
  name: vine.string(),
  email: vine.string().email(),
  password: vine.string().minLength(5).confirmed(),
  phone: vine.string().minLength(10).maxLength(10),
  role_id: vine.number().optional(),
});

export const UpdateUserSchema = vine.object({
  name: vine.string().optional(),
  email: vine.string().email().optional(),
  password: vine.string().minLength(5).confirmed().optional(),
  phone: vine.string().minLength(10).maxLength(10).optional(),
  role_id: vine.number().optional(),
});

export const UserLoginSchema = vine.object({
  email: vine.string().email(),
  password: vine.string().minLength(5),
});
