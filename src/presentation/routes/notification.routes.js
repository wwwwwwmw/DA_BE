const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { listMyNotifications, createNotification, markRead } = require('../controllers/notification.controller');

/**
 * @swagger
 * tags:
 *   name: Thông báo
 *   description: APIs quản lý thông báo và tin nhắn hệ thống
 */

router.use(auth);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Thông báo]
 *     summary: Danh sách thông báo của tôi
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *         description: Số lượng tối đa
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *         description: Vị trí bắt đầu
 *       - in: query
 *         name: unread
 *         schema: { type: boolean }
 *         description: Chỉ lấy thông báo chưa đọc
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   title: { type: string }
 *                   message: { type: string }
 *                   type: { type: string }
 *                   isRead: { type: boolean }
 *                   createdAt: { type: string, format: date-time }
 *                   ref_type: { type: string }
 *                   ref_id: { type: string }
 */
router.get('/', listMyNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags: [Thông báo]
 *     summary: Gửi thông báo tới người dùng (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, message]
 *             properties:
 *               userId: { type: string, description: ID người nhận }
 *               title: { type: string, description: Tiêu đề thông báo }
 *               message: { type: string, description: Nội dung thông báo }
 *               type: { type: string, description: Loại thông báo }
 *               ref_type: { type: string, description: Loại đối tượng liên quan }
 *               ref_id: { type: string, description: ID đối tượng liên quan }
 *     responses:
 *       201: { description: Gửi thành công }
 *       403: { description: Không có quyền }
 */
router.post('/', requireRole('admin'), createNotification);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [Thông báo]
 *     summary: Đánh dấu đã đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID thông báo
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */
router.put('/:id/read', markRead);

module.exports = router;

