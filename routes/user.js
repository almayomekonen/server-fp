const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const { authenticate } = require("../middlewares/Auth");

router.get("/", authenticate, userController.getAllUsers);
router.delete("/:id", authenticate, userController.deleteUser);
router.put("/:id", authenticate, userController.updateUser);

module.exports = router;
