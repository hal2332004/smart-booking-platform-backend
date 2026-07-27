const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Public routes
router.get('/cities', locationController.getCities);
router.get('/cities/:cityId/districts', locationController.getDistrictsByCity);

module.exports = router;
