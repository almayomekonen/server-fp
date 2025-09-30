const express = require('express');
const router = express.Router();
const statementController = require('../controllers/statement');

router.post('/', statementController.createStatement);
router.get('/', statementController.getAllStatements);
router.delete('/:id', statementController.deleteStatement);
// router/statements.js
router.get('/group/:groupId', statementController.getStatementsByGroupId);
router.get('/:id', statementController.getStatementById);
// מחזיר את כל ההצהרות של ניסוי
router.get('/experiment/:experimentId', statementController.getStatementsByExperimentId);

module.exports = router;
