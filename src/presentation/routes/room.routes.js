const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { listRooms, createRoom, updateRoom, deleteRoom } = require('../controllers/room.controller');

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags: [Quản trị hệ thống]
 *     summary: Danh sách phòng họp
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
 *                   name: { type: string }
 *                   capacity: { type: integer }
 *                   location: { type: string }
 *                   equipment: { type: string }
 *                   isActive: { type: boolean }
 *   post:
 *     tags: [Quản trị hệ thống]
 *     summary: Tạo phòng họp mới (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, description: Tên phòng họp }
 *               capacity: { type: integer, description: Sức chứa }
 *               location: { type: string, description: Vị trí }
 *               equipment: { type: string, description: Thiết bị }
 *     responses:
 *       201: { description: Tạo thành công }
 *       403: { description: Không có quyền }
 *
 * /api/rooms/{id}:
 *   put:
 *     tags: [Quản trị hệ thống]
 *     summary: Cập nhật phòng họp (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               capacity: { type: integer }
 *               location: { type: string }
 *               equipment: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 *   delete:
 *     tags: [Quản trị hệ thống]
 *     summary: Xóa phòng họp (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */

router.get('/', listRooms);

router.use(auth, requireRole('admin'));
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;

