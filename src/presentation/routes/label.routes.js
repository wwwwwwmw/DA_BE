const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { listLabels, createLabel, updateLabel, deleteLabel } = require('../controllers/label.controller');

router.use(auth);
router.get('/', listLabels);
router.post('/', createLabel);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

module.exports = router;

