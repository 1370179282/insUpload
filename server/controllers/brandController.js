const Brand = require('../models/Brand');

// 获取所有品牌
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    return res.status(200).json(brands);
  } catch (error) {
    console.error('获取品牌失败:', error);
    return res.status(500).json({ message: '获取品牌失败', error: error.message });
  }
};

// 更新品牌权重
exports.updateBrandWeight = async (req, res) => {
  try {
    const { id } = req.params;
    const { weight } = req.body;
    
    // 验证权重值
    if (weight < 1 || weight > 100) {
      return res.status(400).json({ message: '权重值必须在1-100之间' });
    }
    
    const brand = await Brand.findByIdAndUpdate(
      id,
      { weight },
      { new: true }
    );
    
    if (!brand) {
      return res.status(404).json({ message: '品牌不存在' });
    }
    
    return res.status(200).json(brand);
  } catch (error) {
    console.error('更新品牌权重失败:', error);
    return res.status(500).json({ message: '更新品牌权重失败', error: error.message });
  }
}; 