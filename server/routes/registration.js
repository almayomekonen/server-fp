//routes/registration.js

const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registration");

// Register new request
router.post("/", registrationController.registerRequest);

// Get all pending requests
router.get("/", registrationController.getAllRegistrationRequests);

// Approve request
router.post("/:id/approve", registrationController.approveRegistrationRequest);

// Reject request
router.delete("/:id", registrationController.rejectRegistrationRequest);

module.exports = router;
