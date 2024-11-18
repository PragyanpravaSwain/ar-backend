import vine from "@vinejs/vine";
import { CustomErrorReporter } from "./CustomErrorReporter.js";

vine.errorReporter = () => new CustomErrorReporter();

export const CreateAddressSchema = vine.object({
  user_id: vine.string(), // User ID must be provided
  street: vine.string(),
  city: vine.string(),
  state: vine.string(),
  postal_code: vine.string().postalCode(), // Assuming a fixed 6-digit postal code
  country: vine.string(),
});

export const UpdateAddressSchema = vine.object({
  street: vine.string().optional(),
  city: vine.string().optional(),
  state: vine.string().optional(),
  postal_code: vine.string().postalCode().optional(),
  country: vine.string().optional(),
});
