const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment');
const Comment = require('../models/Comment'); // <- הוסף את השורה הזו


router.post('/', commentController.createComment);
router.get('/', commentController.getAllComments);
router.delete('/:id', commentController.deleteComment);
// routes/comments.js
router.get('/copy/:copyId', async (req, res) => {
  try {
    const { copyId } = req.params;
    const comments = await Comment.find({ copyId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הערות לפי העתק', error: err });
  }
});


module.exports = router;
