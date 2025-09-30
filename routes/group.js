const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');

router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.delete('/:id', groupController.deleteGroup);
router.get('/byExperiment/:experimentId', groupController.getGroupsByExperimentId);


module.exports = router;
