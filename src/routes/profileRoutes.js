const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * Get current user profile
 * @route GET /api/profiles/me
 */
router.get('/me', requireAuth, (req, res) => {
  // req.user is populated by the authMiddleware
  res.json({
    id: req.user.id,
    email: req.user.email,
    profile: req.user.profile
  });
});

module.exports = router;
