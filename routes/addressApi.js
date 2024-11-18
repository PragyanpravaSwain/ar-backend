import express from "express";
import AddressController from "../Controllers/AddressController.js";

const router = express.Router();

// Address routes
router.post("/", AddressController.createAddress); // Create address
router.get("/", AddressController.getAddress); // Get all addresses for a user
router.put("/", AddressController.updateAddress); // Update an address
router.delete("/:id", AddressController.deleteAddress); // Delete an address

export default router;
