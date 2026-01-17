const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const { authenticate } = require("../middlewares/Auth");

router.get("/", authenticate, userController.getAllUsers);
router.get("/check-username/:username", userController.checkUsername); // No auth required
router.delete("/:id", authenticate, userController.deleteUser);
router.put("/:id", authenticate, userController.updateUser);
router.put("/:id/reset-password", userController.resetPassword); 

module.exports = router;
