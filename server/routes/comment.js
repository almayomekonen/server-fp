const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment");
const Comment = require("../models/Comment"); // <- Add this line

router.post("/", commentController.createComment);
router.get("/", commentController.getAllComments);
router.delete("/:id", commentController.deleteComment);
// Get comments by copy ID
router.get("/copy/:copyId", async (req, res) => {
  try {
    const { copyId } = req.params;
    const comments = await Comment.find({ copyId }).populate(
      "userId",
      "username"
    );
    res.json(comments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching comments by copy", error: err });
  }
});

module.exports = router;
