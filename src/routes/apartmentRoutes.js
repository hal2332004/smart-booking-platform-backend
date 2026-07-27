const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartmentController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', apartmentController.getApartments);
router.get('/:slug', apartmentController.getApartmentBySlug);

// Admin protected routes
router.get('/admin/all', requireAuth, requireAdmin, apartmentController.getAdminApartments);
router.post('/', requireAuth, requireAdmin, apartmentController.createApartment);
router.put('/:id', requireAuth, requireAdmin, apartmentController.updateApartment);
router.delete('/:id', requireAuth, requireAdmin, apartmentController.deleteApartment);

module.exports = router;
