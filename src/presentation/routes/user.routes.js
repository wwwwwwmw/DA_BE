const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requireRole, selfOrAdmin } = require('../middlewares/role.middleware');
const { listUsers, getUser, updateUser, createUser, deleteUser, adminResetPassword, unlockAccount, userBusinessTripConflict } = require('../controllers/user.controller');

/**
 * @swagger
 * tags:
 *   name: Quản lý người dùng
 *   description: APIs quản lý thông tin người dùng, tài khoản và phân quyền
 */

router.use(auth);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Quản lý người dùng]
 *     summary: Danh sách người dùng (Admin/Manager)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, maximum: 200, default: 50 }
 *         description: Số lượng tối đa trả về
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *         description: Vị trí bắt đầu
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
 *                   email: { type: string }
 *                   role: { type: string }
 *                   departmentId: { type: string }
 *                   Department: { type: object }
 *       403: { description: Forbidden }
 */
// Admin: full list; Manager: list only own department
router.get('/', async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!(req.user.role === 'admin' || req.user.role === 'manager')) return res.status(403).json({ message: 'Forbidden' });
  // ?limit=&offset=
  req.query.limit = Math.min(Number(req.query.limit) || 50, 200);
  req.query.offset = Number(req.query.offset) || 0;
  // Signal controller to scope
  req.query._managerDeptScope = req.user.role === 'manager' ? (req.user.departmentId || 'null') : undefined;
  next();
}, listUsers);
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Quản lý người dùng]
 *     summary: Lấy thông tin 1 người dùng (self/admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *                 departmentId: { type: string }
 *                 Department: { type: object }
 *       404: { description: Không tìm thấy }
 *       403: { description: Forbidden }
 */
router.get('/:id', selfOrAdmin('id'), getUser);

// Pre-check business trip conflict for assignment (manager/admin or self)
router.get('/:id/business-trip-conflict', userBusinessTripConflict);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Quản lý người dùng]
 *     summary: Cập nhật thông tin (self/admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID người dùng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: Tên người dùng }
 *               email: { type: string, description: Email }
 *               departmentId: { type: string, description: ID phòng ban }
 *               password: { type: string, description: Mật khẩu mới }
 *               role: { type: string, enum: [admin, manager, employee], description: Vai trò (chỉ admin) }
 *               contact: { type: string, description: Thông tin liên hệ }
 *               employeePin: { type: string, description: Mã nhân viên }
 *               avatarUrl: { type: string, description: Ảnh đại diện }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404: { description: Không tìm thấy }
 *       403: { description: Forbidden }
 */
router.put('/:id', selfOrAdmin('id'), updateUser);
// Admin only create/delete
// Admin create any user; Manager create only employees within own department
router.post('/', createUser);
router.delete('/:id', requireRole('admin'), deleteUser);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     tags: [Users]
 *     summary: Admin reset mật khẩu người dùng (gửi mật khẩu tạm qua email)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       403: { description: Forbidden }
 */
router.post('/:id/reset-password', adminResetPassword);

/**
 * @swagger
 * /api/users/{id}/unlock:
 *   post:
 *     tags: [Users]
 *     summary: Admin mở khóa tài khoản người dùng
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       403: { description: Forbidden }
 */
router.post('/:id/unlock', requireRole('admin'), unlockAccount);

module.exports = router;

