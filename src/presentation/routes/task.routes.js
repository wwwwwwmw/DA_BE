const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { listTasks, createTask, updateTask, deleteTask, stats, applyTask, assignTask, unassignTask, acceptTask, updateProgress, rejectTask, approveRejection, denyRejection, listComments, createComment } = require('../controllers/task.controller');

/**
 * @swagger
 * tags:
 *   name: Quản lý dự án & nhiệm vụ
 *   description: APIs quản lý dự án, nhiệm vụ và phân công công việc
 */

router.use(auth);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Danh sách nhiệm vụ
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *         description: Lọc theo ID dự án
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, completed] }
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *         description: Lọc theo người được phân công
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
 *                   description: { type: string }
 *                   status: { type: string }
 *                   priority: { type: string }
 *                   projectId: { type: string }
 *                   assignments: { type: array }
 */
router.get('/', listTasks);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Tạo nhiệm vụ mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, projectId]
 *             properties:
 *               title: { type: string, description: Tiêu đề nhiệm vụ }
 *               description: { type: string, description: Mô tả chi tiết }
 *               projectId: { type: string, description: ID dự án }
 *               priority: { type: string, enum: [low, normal, high, urgent], default: normal }
 *               weight: { type: number, description: Trọng số (%) }
 *               dueDate: { type: string, format: date-time, description: Hạn hoàn thành }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', createTask);

/**
 * @swagger
 * /api/tasks/stats/summary:
 *   get:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Thống kê tổng quan nhiệm vụ
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 completed: { type: integer }
 *                 inProgress: { type: integer }
 *                 todo: { type: integer }
 */
router.get('/stats/summary', stats);

/**
 * @swagger
 * /api/tasks/{id}/apply:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Ứng tuyển nhiệm vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */
router.post('/:id/apply', applyTask);

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Phân công nhiệm vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, description: ID người được phân công }
 *     responses:
 *       200: { description: Thành công }
 */
router.post('/:id/assign', assignTask);

/**
 * @swagger
 * /api/tasks/{id}/unassign:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Gỡ nhân viên khỏi nhiệm vụ
 *     description: |
 *       - Nếu nhiệm vụ chưa bắt đầu: xóa phân công hoàn toàn
 *       - Nếu nhiệm vụ đã bắt đầu: đặt trạng thái 'inactive' và lưu thời điểm ngưng hoạt động
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, description: ID người cần gỡ }
 *     responses:
 *       200: 
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 taskStarted: { type: boolean, description: Nhiệm vụ đã bắt đầu chưa }
 *                 inactiveAt: { type: string, format: date-time, description: Thời điểm ngưng hoạt động (nếu đã bắt đầu) }
 *       404: { description: Không tìm thấy }
 */
router.post('/:id/unassign', unassignTask);

/**
 * @swagger
 * /api/tasks/{id}/accept:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Chấp nhận nhiệm vụ được phân công
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 */
router.post('/:id/accept', acceptTask);

/**
 * @swagger
 * /api/tasks/{id}/reject:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Từ chối/Yêu cầu thay đổi nhiệm vụ
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
 *               reason: { type: string, description: Lý do từ chối }
 *     responses:
 *       200: { description: Thành công }
 */
router.post('/:id/reject', rejectTask);

/**
 * @swagger
 * /api/tasks/{id}/rejection/approve:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Duyệt yêu cầu thay đổi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 */
router.post('/:id/rejection/approve', approveRejection);

/**
 * @swagger
 * /api/tasks/{id}/rejection/deny:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Từ chối yêu cầu thay đổi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 */
router.post('/:id/rejection/deny', denyRejection);

/**
 * @swagger
 * /api/tasks/{id}/progress:
 *   put:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Cập nhật tiến độ nhiệm vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress: { type: number, minimum: 0, maximum: 100, description: Tiến độ (%) }
 *     responses:
 *       200: { description: Thành công }
 */
router.put('/:id/progress', updateProgress);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Cập nhật nhiệm vụ
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
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, normal, high, urgent] }
 *               weight: { type: number }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200: { description: Thành công }
 */
router.put('/:id', updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Xóa nhiệm vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy }
 */
router.delete('/:id', deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Danh sách bình luận nhiệm vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *                   content: { type: string }
 *                   userId: { type: string }
 *                   createdAt: { type: string, format: date-time }
 */
router.get('/:id/comments', listComments);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     tags: [Quản lý dự án & nhiệm vụ]
 *     summary: Thêm bình luận nhiệm vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, description: Nội dung bình luận }
 *     responses:
 *       201: { description: Thành công }
 */
router.post('/:id/comments', createComment);

module.exports = router;

