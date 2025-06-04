const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// 获取所有图片（根据品牌筛选）
router.get('/', imageController.getImages);

// 更新图片状态
router.put('/status', imageController.updateImageStatus);

// 生成图片队列
router.post('/generate-queue', imageController.generateImageQueue);

// 完成上传图片
router.post('/:id/complete', imageController.completeUpload);

module.exports = router; 