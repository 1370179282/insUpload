const fs = require('fs-extra');
const path = require('path');
const Image = require('../models/Image');
const Brand = require('../models/Brand');
const Setting = require('../models/Setting');

// 获取所有图片（根据品牌筛选）
exports.getImages = async (req, res) => {
  try {
    const { brand, status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (brand) {
      query.brand = brand;
    }
    
    if (status && ['未上传', '已上传'].includes(status)) {
      query.status = status;
    }
    
    const total = await Image.countDocuments(query);
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      images,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取图片失败:', error);
    return res.status(500).json({ message: '获取图片失败', error: error.message });
  }
};

// 更新图片状态
exports.updateImageStatus = async (req, res) => {
  try {
    const { ids } = req.body;
    const { status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供有效的图片ID列表' });
    }
    
    if (!['未上传', '已上传'].includes(status)) {
      return res.status(400).json({ message: '状态值无效' });
    }
    
    const result = await Image.updateMany(
      { _id: { $in: ids } },
      { status }
    );
    
    return res.status(200).json({
      message: `成功更新 ${result.modifiedCount} 张图片状态`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('更新图片状态失败:', error);
    return res.status(500).json({ message: '更新图片状态失败', error: error.message });
  }
};

// 生成图片队列
exports.generateImageQueue = async (req, res) => {
  try {
    // 获取系统设置
    const settings = await Setting.findOne();
    
    if (!settings || !settings.outputPath) {
      return res.status(400).json({ message: '请先设置输出路径' });
    }
    
    // 检查输出路径是否存在
    if (!(await fs.pathExists(settings.outputPath))) {
      return res.status(400).json({ message: '输出路径不存在' });
    }
    
    // 获取所有未上传的图片
    const unuploadedImages = await Image.find({ status: '未上传' });
    
    if (unuploadedImages.length === 0) {
      return res.status(400).json({ message: '没有未上传的图片可供选择' });
    }
    
    // 获取所有品牌及其权重
    const brands = await Brand.find();
    const brandWeights = {};
    let totalWeight = 0;
    
    brands.forEach(brand => {
      brandWeights[brand.name] = brand.weight;
      totalWeight += brand.weight;
    });
    
    // 按品牌分组图片
    const imagesByBrand = {};
    unuploadedImages.forEach(image => {
      if (!imagesByBrand[image.brand]) {
        imagesByBrand[image.brand] = [];
      }
      imagesByBrand[image.brand].push(image);
    });
    
    // 根据权重随机选择品牌
    let randomValue = Math.random() * totalWeight;
    let selectedBrand = null;
    
    for (const brandName in brandWeights) {
      randomValue -= brandWeights[brandName];
      if (randomValue <= 0) {
        selectedBrand = brandName;
        break;
      }
    }
    
    // 如果没有选中品牌（极少数情况），随机选择一个
    if (!selectedBrand || !imagesByBrand[selectedBrand] || imagesByBrand[selectedBrand].length === 0) {
      const availableBrands = Object.keys(imagesByBrand).filter(brand => imagesByBrand[brand].length > 0);
      if (availableBrands.length === 0) {
        return res.status(400).json({ message: '没有可用的品牌图片' });
      }
      selectedBrand = availableBrands[Math.floor(Math.random() * availableBrands.length)];
    }
    
    // 从选中品牌中随机选择一张图片
    const brandImages = imagesByBrand[selectedBrand];
    const selectedImage = brandImages[Math.floor(Math.random() * brandImages.length)];
    
    // 复制图片到输出目录
    try {
      const outputFilePath = path.join(settings.outputPath, `pendingImages_${selectedImage.name}`);
      await fs.copy(selectedImage.path, outputFilePath);
      
      return res.status(200).json({
        message: '成功生成图片队列',
        image: selectedImage,
        outputPath: outputFilePath
      });
    } catch (error) {
      console.error('复制图片失败:', error);
      return res.status(500).json({ message: '复制图片失败', error: error.message });
    }
  } catch (error) {
    console.error('生成图片队列失败:', error);
    return res.status(500).json({ message: '生成图片队列失败', error: error.message });
  }
};

// 完成上传图片
exports.completeUpload = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取系统设置
    const settings = await Setting.findOne();
    
    if (!settings || !settings.outputPath) {
      return res.status(400).json({ message: '请先设置输出路径' });
    }
    
    // 查找图片
    const image = await Image.findById(id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }
    
    // 更新图片状态
    image.status = '已上传';
    await image.save();
    
    // 删除输出目录中的文件
    const outputFilePath = path.join(settings.outputPath, `pendingImages_${image.name}`);
    
    if (await fs.pathExists(outputFilePath)) {
      await fs.remove(outputFilePath);
    }
    
    return res.status(200).json({
      message: '成功完成上传',
      image
    });
  } catch (error) {
    console.error('完成上传失败:', error);
    return res.status(500).json({ message: '完成上传失败', error: error.message });
  }
}; 