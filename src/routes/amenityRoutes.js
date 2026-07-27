const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');

// Public routes
router.get('/', amenityController.getAmenities);

module.exports = router;
