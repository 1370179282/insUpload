const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// 获取所有文件（根据条件筛选）
router.get('/', fileController.getFiles);

// 更新文件状态
router.put('/status', fileController.updateFileStatus);

// 生成队列
router.post('/generate-queue', fileController.generateQueue);

// 完成上传文件
router.post('/:id/complete', fileController.completeUpload);

module.exports = router; 