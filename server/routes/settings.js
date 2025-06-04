const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// 获取系统配置
router.get('/', settingsController.getSettings);

// 更新系统配置
router.put('/', settingsController.updateSettings);

// 读取品牌文件夹
router.post('/read-brands', settingsController.readBrandFolders);

// 初始化素材
router.post('/initialize-materials', settingsController.initializeMaterials);

// 创建测试目录结构
router.post('/create-test-directories', settingsController.createTestDirectories);

// 获取文件类型
router.get('/file-types', settingsController.getFileTypes);

// 更新文件类型
router.put('/file-types/:id', settingsController.updateFileType);

module.exports = router; 