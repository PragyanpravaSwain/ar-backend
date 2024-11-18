import prisma from "../DB/db.config.js";
import {
  CreateAddressSchema,
  UpdateAddressSchema,
} from "../Validations/schema/AddressSchema.js";
import vine from "@vinejs/vine";

class AddressController {
  // Create Address
  static async createAddress(req, res) {
    try {
      const body = req.body;

      // Validate request payload
      const validator = vine.compile(CreateAddressSchema);
      const payload = await validator.validate(body);

      // Check if the user already has an address
      const existingAddress = await prisma.address.findUnique({
        where: { user_id: payload.user_id },
      });

      if (existingAddress) {
        return res.status(400).json({
          status: 400,
          message: "User already has an address",
        });
      }

      const address = await prisma.address.create({
        data: payload,
      });

      res.status(201).json({
        status: 201,
        message: "Address created successfully",
        address,
      });
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(400).json({
        status: 400,
        message: error.messages || "Validation error",
        error,
      });
    }
  }

  // Update Address
  static async updateAddress(req, res) {
    try {
      const id = req.user.userId; // Address ID
      const body = req.body;
      const address1 = await prisma.address.findFirst({
        where: { user_id: id },
      });

      // Validate request payload
      const validator = vine.compile(UpdateAddressSchema);
      const payload = await validator.validate(body);

      const address = await prisma.address.update({
        where: { id: address1.id },
        data: payload,
      });

      res.status(200).json({
        status: 200,
        message: "Address updated successfully",
        address,
      });
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(400).json({
        status: 400,
        message: error.messages || "Validation error",
        error,
      });
    }
  }

  // Get Address for a User
  static async getAddress(req, res) {
    try {
      const userId = req.user.userId; // Get the user ID from the request

      // Fetch the user's address from the database
      const address = await prisma.address.findFirst({
        where: { user_id: userId },
      });

      // Check if the address exists
      if (!address) {
        return res.status(404).json({
          status: 404,
          message: "Address not found for this user",
        });
      }

      // If the address exists, return it in the response
      return res.status(200).json({
        status: 200,
        message: "Address found",
        address, // Include the address in the response
      });
    } catch (error) {
      // Handle any errors that occur during the process
      console.error("Error fetching address:", error);
      return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error.message || error, // Include the error message
      });
    }
  }

  // Delete Address
  static async deleteAddress(req, res) {
    try {
      const { id } = req.params; // Address ID

      const address = await prisma.address.update({
        where: { id },
        data: { deleted: true, deleted_at: new Date() },
      });

      res.status(200).json({
        status: 200,
        message: "Address deleted successfully",
        address,
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      res
        .status(500)
        .json({ status: 500, message: "Internal Server Error", error });
    }
  }
}

export default AddressController;
