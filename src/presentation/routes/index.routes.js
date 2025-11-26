const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/departments', require('./department.routes'));
router.use('/rooms', require('./room.routes'));
router.use('/events', require('./event.routes'));
router.use('/participants', require('./participant.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/projects', require('./project.routes'));
router.use('/labels', require('./label.routes'));
router.use('/schedule', require('./schedule.routes'));
router.use('/backup', require('./backup.routes'));

module.exports = router;

