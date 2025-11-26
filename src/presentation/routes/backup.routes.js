const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { createBackup, restoreBackup } = require('../controllers/backup.controller');
const multer = require('multer');
const path = require('path');
const os = require('os');
// Use disk storage so pg_restore can read the file directly
const upload = multer({ dest: path.join(os.tmpdir(), 'pg_restore_uploads') });

/**
 * @swagger
 * tags:
 *   name: Sao lưu & khôi phục
 *   description: APIs sao lưu và khôi phục dữ liệu
 */

router.use(auth);

/**
 * @swagger
 * /api/backup/create:
 *   get:
 *     tags: [Backup]
 *     summary: Tạo file sao lưu CSDL custom format PostgreSQL (.backup) (admin-only)
 *     responses:
 *       200:
 *         description: File .backup được trả về (application/octet-stream)
 */
router.get('/create', requireRole('admin'), createBackup);

/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     tags: [Sao lưu & khôi phục]
 *     summary: Phục hồi toàn bộ dữ liệu từ file .backup (ghi đè, admin-only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               backupFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: OK }
 */
router.post('/restore', requireRole('admin'), upload.single('backupFile'), restoreBackup);

module.exports = router;

