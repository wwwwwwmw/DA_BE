const express = require('express');
const router = express.Router();
const { eventsByMonth, eventsByDepartment, exportEventsCsv, departmentSummary } = require('../controllers/reports.controller');
const auth = require('../middlewares/auth.middleware');
const authOrQuery = require('../middlewares/auth_or_query.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Thống kê & Báo cáo
 */

/**
 * @swagger
 * /api/reports/eventsByMonth:
 *   get:
 *     tags: [Reports]
 *     summary: Thống kê lịch theo tháng
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 */
router.get('/eventsByMonth', eventsByMonth);

/**
 * @swagger
 * /api/reports/eventsByDepartment:
 *   get:
 *     tags: [Reports]
 *     summary: Thống kê lịch theo phòng ban
 */
router.get('/eventsByDepartment', eventsByDepartment);

// Manager department summary (tasks + events counts)
router.get('/departmentSummary', auth, requireRole('manager'), departmentSummary);

/**
 * @swagger
 * /api/reports/export/events:
 *   get:
 *     tags: [Reports]
 *     summary: Xuất CSV danh sách lịch công tác
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 */
// Allow auth via header or `?token=` for download convenience
router.get('/export/events', authOrQuery, requireRole('admin','manager'), exportEventsCsv);

module.exports = router;

