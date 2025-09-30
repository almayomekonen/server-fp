//routes/registration.js

const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration');



// רישום בקשה חדשה
router.post('/', registrationController.registerRequest);

// קבלת כל הבקשות הממתינות
router.get('/', registrationController.getAllRegistrationRequests);

// אישור בקשה
router.post('/:id/approve', registrationController.approveRegistrationRequest);

// דחיית בקשה
router.delete('/:id', registrationController.rejectRegistrationRequest);



module.exports = router;
