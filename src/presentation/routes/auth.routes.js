const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const { User } = require('../../infrastructure/database/models');

/**
 * @swagger
 * tags:
 *   name: Xác thực & Bảo mật
 *   description: APIs liên quan đến đăng nhập, đăng ký và xác thực người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Xác thực & Bảo mật]
 *     summary: Đăng ký người dùng mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, manager, employee] }
 *               departmentId: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Xác thực & Bảo mật]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Xác thực & Bảo mật]
 *     summary: Quên mật khẩu (gời email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.post('/forgot-password', forgotPassword);

// Optional helper for actually resetting with the emailed token
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Xác thực & Bảo mật]
 *     summary: Thông tin người dùng hiện tại (Bearer token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.get('/me', auth, async (req, res) => {
	try {
		const user = await User.findByPk(req.user.id);
		if (!user) return res.status(404).json({ message: 'Not found' });
		const plain = user.toJSON();
		delete plain.password;
		return res.json(plain);
	} catch (e) { return res.status(500).json({ message: e.message }); }
});

module.exports = router;

