const express = require('express');
const router = express.Router();
const styleController = require('../controllers/styleSetting');

router.get('/', styleController.getStyle);
router.put('/', styleController.updateStyle);

module.exports = router;
