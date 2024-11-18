import vine from "@vinejs/vine";
import { CustomErrorReporter } from "./CustomErrorReporter.js";

vine.errorReporter = () => new CustomErrorReporter();

export const NameDescriptionSchema = vine.object({
  name: vine.string().minLength(3),
  description: vine.string().minLength(3),
});

export const NameDescriptionOptionalSchema = vine.object({
  name: vine.string().minLength(3).optional(),
  description: vine.string().minLength(3).optional(),
});
