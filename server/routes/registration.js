//routes/registration.js

const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registration");

// Register new request
router.post("/", registrationController.registerRequest);

// Check username/email availability
router.post("/check-availability", registrationController.checkAvailability);

// Get all pending requests
router.get("/", registrationController.getAllRegistrationRequests);

// Approve request
router.post("/:id/approve", registrationController.approveRegistrationRequest);

// Reject request
router.delete("/:id", registrationController.rejectRegistrationRequest);

module.exports = router;
