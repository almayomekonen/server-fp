const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experiment');

router.post('/', experimentController.createExperiment);
router.get('/', experimentController.getAllExperiments);
router.get('/:id', experimentController.getExperimentById); // ניסוי לפי ID
router.get('/:id/investigatorName', experimentController.getInvestigatorNameByExperimentId); // שם החוקר לפי ניסוי
router.get('/by-investigator-id/:investigatorId', experimentController.getExperimentsByInvestigatorId); // ניסויים לפי מזהה חוקר
router.delete('/:id', experimentController.deleteExperiment);
router.put('/:id', experimentController.updateExperiment);

module.exports = router;
