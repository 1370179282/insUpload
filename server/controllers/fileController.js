const fs = require('fs-extra');
const path = require('path');
const File = require('../models/File');
const Brand = require('../models/Brand');
const Setting = require('../models/Setting');
const FileType = require('../models/FileType');

// 获取所有文件（根据条件筛选）
exports.getFiles = async (req, res) => {
  try {
    const { type, brand, status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (brand) {
      query.brand = brand;
    }
    
    if (status && ['未上传', '已上传'].includes(status)) {
      query.status = status;
    }
    
    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      files,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取文件失败:', error);
    return res.status(500).json({ message: '获取文件失败', error: error.message });
  }
};

// 更新文件状态
exports.updateFileStatus = async (req, res) => {
  try {
    const { ids } = req.body;
    const { status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供有效的文件ID列表' });
    }
    
    if (!['未上传', '已上传'].includes(status)) {
      return res.status(400).json({ message: '状态值无效' });
    }
    
    const result = await File.updateMany(
      { _id: { $in: ids } },
      { status }
    );
    
    return res.status(200).json({
      message: `成功更新 ${result.modifiedCount} 个文件状态`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('更新文件状态失败:', error);
    return res.status(500).json({ message: '更新文件状态失败', error: error.message });
  }
};

// 生成队列
exports.generateQueue = async (req, res) => {
  try {
    const { fileType } = req.body;
    console.log('生成队列请求，文件类型:', fileType);
    
    // 获取系统设置
    const settings = await Setting.findOne();
    console.log('系统设置:', settings);
    
    if (!settings || !settings.outputPath) {
      return res.status(400).json({ message: '请先设置输出路径' });
    }
    
    // 检查输出路径是否存在
    if (!(await fs.pathExists(settings.outputPath))) {
      return res.status(400).json({ message: '输出路径不存在' });
    }
    
    // 设置要查询的文件类型
    const type = fileType || settings.defaultFileType;
    console.log('选择的文件类型:', type);
    
    let fileTypeQuery = {};
    
    if (type !== 'both') {
      fileTypeQuery.type = type;
    }
    
    // 获取所有未上传的文件
    const unuploadedFiles = await File.find({ 
      ...fileTypeQuery, 
      status: '未上传' 
    });
    
    console.log(`找到 ${unuploadedFiles.length} 个未上传的文件`);
    
    if (unuploadedFiles.length === 0) {
      return res.status(400).json({ message: `没有未上传的${type === 'image' ? '图片' : type === 'video' ? '视频' : '文件'}可供选择` });
    }
    
    let selectedFile;
    
    // 根据文件类型选择不同的选择方法
    if (type === 'image' || (type === 'both' && Math.random() < 0.5)) {
      console.log('选择图片类型文件');
      // 图片类型或随机选择了图片类型，使用权重规则
      const imageFileType = await FileType.findOne({ name: 'image' });
      console.log('图片文件类型配置:', imageFileType);
      
      if (imageFileType && imageFileType.enabled && imageFileType.useWeightRules) {
        console.log('使用权重规则选择图片');
        // 使用权重规则
        const imageFiles = unuploadedFiles.filter(file => file.type === 'image');
        console.log(`找到 ${imageFiles.length} 个图片文件`);
        selectedFile = await selectFileWithWeights(imageFiles);
      } else {
        console.log('不使用权重规则，直接随机选择图片');
        // 不使用权重规则，直接随机选择
        const imageFiles = unuploadedFiles.filter(file => file.type === 'image');
        console.log(`找到 ${imageFiles.length} 个图片文件`);
        if (imageFiles.length > 0) {
          const randomIndex = Math.floor(Math.random() * imageFiles.length);
          selectedFile = imageFiles[randomIndex];
          console.log(`随机选择图片索引: ${randomIndex}, 文件名: ${selectedFile.name}`);
        }
      }
    } else {
      console.log('选择视频类型文件');
      // 视频类型或随机选择了视频类型，直接随机选择
      const videoFiles = unuploadedFiles.filter(file => file.type === 'video');
      console.log(`找到 ${videoFiles.length} 个视频文件`);
      if (videoFiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * videoFiles.length);
        selectedFile = videoFiles[randomIndex];
        console.log(`随机选择视频索引: ${randomIndex}, 文件名: ${selectedFile.name}`);
      }
    }
    
    if (!selectedFile) {
      return res.status(400).json({ message: '没有可用的文件' });
    }
    
    console.log('最终选择的文件:', selectedFile);
    
    // 复制文件到输出目录
    try {
      // 确保文件名在不同操作系统下都有效
      const sanitizedFileName = selectedFile.name.replace(/[\\/:*?"<>|]/g, '_');
      const outputFilePath = path.join(settings.outputPath, `pendingFiles_${sanitizedFileName}`);
      console.log('输出文件路径:', outputFilePath);
      await fs.copy(selectedFile.path, outputFilePath);
      
      return res.status(200).json({
        message: '成功生成队列',
        file: selectedFile,
        outputPath: outputFilePath
      });
    } catch (error) {
      console.error('复制文件失败:', error);
      return res.status(500).json({ message: '复制文件失败', error: error.message });
    }
  } catch (error) {
    console.error('生成队列失败:', error);
    return res.status(500).json({ message: '生成队列失败', error: error.message });
  }
};

// 根据权重选择文件
async function selectFileWithWeights(files) {
  if (files.length === 0) {
    console.log('没有文件可供选择');
    return null;
  }
  
  console.log(`开始根据权重选择，共有 ${files.length} 个文件`);
  
  // 获取所有品牌及其权重
  const brands = await Brand.find();
  console.log('所有品牌及权重:', brands.map(b => ({ name: b.name, weight: b.weight })));
  
  const brandWeights = {};
  let totalWeight = 0;
  
  brands.forEach(brand => {
    // 只添加权重大于0的品牌
    if (brand.weight > 0) {
      brandWeights[brand.name] = brand.weight;
      totalWeight += brand.weight;
    } else {
      console.log(`品牌 ${brand.name} 权重为0，不会出现在队列中`);
    }
  });
  
  console.log('品牌权重映射:', brandWeights);
  console.log('总权重:', totalWeight);
  
  // 如果没有任何品牌有大于0的权重，直接返回null
  if (totalWeight === 0) {
    console.log('没有任何品牌具有大于0的权重，无法生成队列');
    return null;
  }
  
  // 按品牌分组文件
  const filesByBrand = {};
  files.forEach(file => {
    if (!filesByBrand[file.brand]) {
      filesByBrand[file.brand] = [];
    }
    filesByBrand[file.brand].push(file);
  });
  
  console.log('按品牌分组的文件数量:');
  Object.keys(filesByBrand).forEach(brand => {
    console.log(`${brand}: ${filesByBrand[brand].length} 个文件`);
  });
  
  // 根据权重随机选择品牌
  let randomValue = Math.random() * totalWeight;
  const originalRandomValue = randomValue;
  console.log('随机权重值:', randomValue);
  
  let selectedBrand = null;
  
  console.log('权重选择过程:');
  for (const brandName in brandWeights) {
    const brandWeight = brandWeights[brandName];
    randomValue -= brandWeight;
    console.log(`品牌: ${brandName}, 权重: ${brandWeight}, 剩余随机值: ${randomValue}`);
    
    if (randomValue <= 0) {
      selectedBrand = brandName;
      console.log(`选中品牌: ${brandName}`);
      break;
    }
  }
  
  // 如果没有选中品牌（极少数情况），随机选择一个
  if (!selectedBrand || !filesByBrand[selectedBrand] || filesByBrand[selectedBrand].length === 0) {
    console.log(`未能选中有效品牌(${selectedBrand || '无'}), 尝试随机选择一个`);
    
    // 只从权重大于0的品牌中选择
    const availableBrands = Object.keys(filesByBrand).filter(brand => 
      filesByBrand[brand].length > 0 && brandWeights[brand] > 0
    );
    console.log('可用品牌:', availableBrands);
    
    if (availableBrands.length === 0) {
      console.log('没有可用的品牌');
      return null;
    }
    
    selectedBrand = availableBrands[Math.floor(Math.random() * availableBrands.length)];
    console.log(`随机选中品牌: ${selectedBrand}`);
  }
  
  // 从选中品牌中随机选择一个文件
  const brandFiles = filesByBrand[selectedBrand];
  const fileIndex = Math.floor(Math.random() * brandFiles.length);
  const selectedFile = brandFiles[fileIndex];
  
  console.log(`从品牌 ${selectedBrand} 中选择了文件 ${selectedFile.name} (索引: ${fileIndex}, 共 ${brandFiles.length} 个文件)`);
  console.log('选择过程摘要:');
  console.log(`- 总权重: ${totalWeight}`);
  console.log(`- 随机值: ${originalRandomValue}`);
  console.log(`- 选中品牌: ${selectedBrand}`);
  console.log(`- 选中品牌权重: ${brandWeights[selectedBrand]}`);
  console.log(`- 选中品牌的权重百分比: ${(brandWeights[selectedBrand] / totalWeight * 100).toFixed(2)}%`);
  
  return selectedFile;
}

// 完成上传文件
exports.completeUpload = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取系统设置
    const settings = await Setting.findOne();
    
    if (!settings || !settings.outputPath) {
      return res.status(400).json({ message: '请先设置输出路径' });
    }
    
    // 查找文件
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    // 更新文件状态
    file.status = '已上传';
    await file.save();
    
    // 删除输出目录中的文件
    const sanitizedFileName = file.name.replace(/[\\/:*?"<>|]/g, '_');
    const outputFilePath = path.join(settings.outputPath, `pendingFiles_${sanitizedFileName}`);
    
    if (await fs.pathExists(outputFilePath)) {
      await fs.remove(outputFilePath);
    }
    
    return res.status(200).json({
      message: '成功完成上传',
      file
    });
  } catch (error) {
    console.error('完成上传失败:', error);
    return res.status(500).json({ message: '完成上传失败', error: error.message });
  }
};