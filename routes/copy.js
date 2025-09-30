const express = require("express");
const router = express.Router();
const copyController = require("../controllers/copy");
const { authenticate } = require("../middlewares/Auth");

router.post("/", authenticate, copyController.createCopy);
router.get("/", authenticate, copyController.getAllCopies);
router.delete("/:id", authenticate, copyController.deleteCopy);
router.put("/:id", authenticate, copyController.updateCopy);

module.exports = router;
