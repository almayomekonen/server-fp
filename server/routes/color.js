const express = require('express');
const router = express.Router();
const colorController = require('../controllers/color');

router.get('/', colorController.getColors);
router.post('/', colorController.createColor);
router.delete('/:id', colorController.deleteColor);

module.exports = router;
