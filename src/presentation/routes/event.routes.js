const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const maybeAuth = require('../middlewares/maybe_auth.middleware');
const { listEvents, getEvent, createEvent, updateEvent, deleteEvent, downloadICS } = require('../controllers/event.controller');
const { query, body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Quản lý lịch trình
 *   description: APIs quản lý lịch họp, lịch công tác và các sự kiện
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     tags: [Quản lý lịch trình]
 *     summary: Danh sách lịch (có lọc/phân trang)
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Thời gian bắt đầu tìm kiếm
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Thời gian kết thúc tìm kiếm
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, completed] }
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [meeting, business_trip] }
 *         description: Loại sự kiện
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     tags: [Quản lý lịch trình]
 *     summary: Tạo sự kiện mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, start_time, end_time]
 *             properties:
 *               title: { type: string }
 *               start_time: { type: string, format: date-time }
 *               end_time: { type: string, format: date-time }
 *               type: { type: string, enum: [meeting, business_trip] }
 *     responses:
 *       201: { description: Tạo thành công }
 *
 * /api/events/{id}:
 *   get:
 *     tags: [Quản lý lịch trình]
 *     summary: Chi tiết sự kiện
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *   put:
 *     tags: [Quản lý lịch trình]
 *     summary: Cập nhật sự kiện
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *   delete:
 *     tags: [Quản lý lịch trình]
 *     summary: Xóa sự kiện
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *
 * /api/events/{id}/ics:
 *   get:
 *     tags: [Quản lý lịch trình]
 *     summary: Tải file ICS cho lịch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File ICS
 */

// Populate req.user if token is present; otherwise treat as public access
router.get('/', maybeAuth, listEvents);
router.get('/:id', getEvent);
router.get('/:id/ics', downloadICS);

router.use(auth);
router.post('/',
  validate([
    body('title').isString().notEmpty(),
    body('start_time').isISO8601(),
    body('end_time').isISO8601()
  ]),
  createEvent
);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;

