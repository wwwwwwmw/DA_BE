const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { listDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/department.controller');

/**
 * @swagger
 * tags:
 *   name: Quản trị hệ thống
 *   description: APIs quản lý phòng ban, phòng họp và cấu hình hệ thống
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Quản trị hệ thống]
 *     summary: Danh sách phòng ban
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
 *                   description: { type: string }
 *                   managerId: { type: string }
 *                   createdAt: { type: string, format: date-time }
 *   post:
 *     tags: [Quản trị hệ thống]
 *     summary: Tạo phòng ban mới (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, description: Tên phòng ban }
 *               description: { type: string, description: Mô tả }
 *               managerId: { type: string, description: ID trưởng phòng }
 *     responses:
 *       201: { description: Tạo thành công }
 *       403: { description: Không có quyền }
 *
 * /api/departments/{id}:
 *   put:
 *     tags: [Quản trị hệ thống]
 *     summary: Cập nhật phòng ban (Admin)
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
 *               description: { type: string }
 *               managerId: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 *   delete:
 *     tags: [Quản trị hệ thống]
 *     summary: Xóa phòng ban (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */

router.get('/', listDepartments);

router.use(auth, requireRole('admin'));

router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;

