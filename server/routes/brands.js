const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

// 获取所有品牌
router.get('/', brandController.getAllBrands);

// 更新品牌权重
router.put('/:id', brandController.updateBrandWeight);

module.exports = router; 