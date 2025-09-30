const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparison');

router.post('/', comparisonController.createComparison);
router.post('/remove-comparison', comparisonController.deleteComparison);
router.post('/remove-all-comparisons', comparisonController.removeAllComparisons);
router.get('/', comparisonController.getAllComparisons);
router.get('/copy/:copyId', comparisonController.getComparisonsForCopyById);
router.post('/check-exists', comparisonController.checkComparisonExists);


module.exports = router;
