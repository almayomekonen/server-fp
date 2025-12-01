const express = require("express");
const router = express.Router();
const experimentController = require("../controllers/experiment");

router.post("/", experimentController.createExperiment);
router.get("/", experimentController.getAllExperiments);
router.get("/:id", experimentController.getExperimentById); // Experiment by ID
router.get(
  "/:id/investigatorName",
  experimentController.getInvestigatorNameByExperimentId
); // Investigator name by experiment
router.get(
  "/by-investigator-id/:investigatorId",
  experimentController.getExperimentsByInvestigatorId
); // Experiments by investigator ID
router.delete("/:id", experimentController.deleteExperiment);
router.put("/:id", experimentController.updateExperiment);

module.exports = router;
