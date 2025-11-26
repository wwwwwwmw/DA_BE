const express = require('express');
const router = express.Router();
const maybeAuth = require('../middlewares/maybe_auth.middleware');
const { upcoming } = require('../controllers/schedule.controller');

// Optional auth for role-based filtering, unauth sees global approved events only (no tasks)
router.get('/upcoming', maybeAuth, upcoming);

module.exports = router;

module.exports = router;
