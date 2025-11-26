const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { listProjects, createProject, updateProject, deleteProject } = require('../controllers/project.controller');

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Danh sách dự án
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
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Tạo dự án mới (Admin/Manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, description: Tên dự án }
 *               description: { type: string, description: Mô tả dự án }
 *     responses:
 *       201: { description: Tạo thành công }
 *       403: { description: Không có quyền }
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Cập nhật dự án (Admin/Manager)
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
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Xóa dự án (Admin/Manager)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */

router.use(auth);
router.get('/', listProjects);
const { requireRole } = require('../middlewares/role.middleware');
router.post('/', requireRole('admin','manager'), createProject);
router.put('/:id', requireRole('admin','manager'), updateProject);
router.delete('/:id', requireRole('admin','manager'), deleteProject);

module.exports = router;

