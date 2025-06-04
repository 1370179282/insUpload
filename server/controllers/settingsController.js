const fs = require('fs-extra');
const path = require('path');
const Setting = require('../models/Setting');
const Brand = require('../models/Brand');
const File = require('../models/File');
const FileType = require('../models/FileType');

// 获取系统配置
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = await Setting.create({
        outputPath: '',
        materialRootPath: '',
        videoRootPath: '',
        queueSize: 100,
        defaultFileType: 'image'
      });
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('获取配置失败:', error);
    return res.status(500).json({ message: '获取配置失败', error: error.message });
  }
};

// 更新系统配置
exports.updateSettings = async (req, res) => {
  try {
    let { outputPath, materialRootPath, videoRootPath, queueSize, defaultFileType } = req.body;
    
    // 规范化路径，确保跨平台兼容
    if (outputPath) outputPath = path.normalize(outputPath);
    if (materialRootPath) materialRootPath = path.normalize(materialRootPath);
    if (videoRootPath) videoRootPath = path.normalize(videoRootPath);
    
    console.log('规范化后的路径:');
    console.log('- 输出路径:', outputPath);
    console.log('- 素材根路径:', materialRootPath);
    console.log('- 视频根路径:', videoRootPath);
    
    // 验证路径是否存在
    if (outputPath && !(await fs.pathExists(outputPath))) {
      return res.status(400).json({ message: '输出路径不存在' });
    }
    
    if (materialRootPath && !(await fs.pathExists(materialRootPath))) {
      return res.status(400).json({ message: '素材根路径不存在' });
    }
    
    if (videoRootPath && !(await fs.pathExists(videoRootPath))) {
      return res.status(400).json({ message: '视频根路径不存在' });
    }
    
    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = await Setting.create({
        outputPath,
        materialRootPath,
        videoRootPath,
        queueSize: queueSize || 100,
        defaultFileType: defaultFileType || 'image'
      });
    } else {
      settings = await Setting.findOneAndUpdate(
        {},
        { outputPath, materialRootPath, videoRootPath, queueSize, defaultFileType },
        { new: true }
      );
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('更新配置失败:', error);
    return res.status(500).json({ message: '更新配置失败', error: error.message });
  }
};

// 读取品牌文件夹
exports.readBrandFolders = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    
    if (!settings || !settings.materialRootPath) {
      return res.status(400).json({ message: '请先设置素材根路径' });
    }
    
    // 检查路径是否存在
    if (!(await fs.pathExists(settings.materialRootPath))) {
      return res.status(400).json({ message: '素材根路径不存在' });
    }
    
    // 图片素材根目录下应该有各个品牌文件夹
    const imagesPath = path.join(settings.materialRootPath, 'images');
    
    if (!(await fs.pathExists(imagesPath))) {
      return res.status(400).json({ message: 'images 目录不存在' });
    }
    
    // 读取 images 目录下的所有文件夹（品牌文件夹）
    const files = await fs.readdir(imagesPath);
    const folders = [];
    
    for (const file of files) {
      const fullPath = path.join(imagesPath, file);
      const stats = await fs.stat(fullPath);
      
      // 只选择文件夹
      if (stats.isDirectory()) {
        // 检查是否已存在于品牌表中
        let brand = await Brand.findOne({ name: file });
        
        if (!brand) {
          // 如果不存在，则创建新品牌
          brand = await Brand.create({
            name: file,
            weight: 50, // 默认权重
            path: fullPath
          });
        } else {
          // 更新路径
          brand = await Brand.findOneAndUpdate(
            { name: file },
            { path: fullPath },
            { new: true }
          );
        }
        
        folders.push(brand);
      }
    }
    
    return res.status(200).json(folders);
  } catch (error) {
    console.error('读取品牌文件夹失败:', error);
    return res.status(500).json({ message: '读取品牌文件夹失败', error: error.message });
  }
};

// 初始化文件类型
exports.initializeFileTypes = async () => {
  try {
    const fileTypes = [
      {
        name: 'image',
        enabled: true,
        useWeightRules: true,
        extensions: ['.jpg', '.jpeg', '.png', '.gif']
      },
      {
        name: 'video',
        enabled: true,
        useWeightRules: false,
        extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv']
      }
    ];
    
    for (const type of fileTypes) {
      const existing = await FileType.findOne({ name: type.name });
      
      if (!existing) {
        await FileType.create(type);
      }
    }
    
    return true;
  } catch (error) {
    console.error('初始化文件类型失败:', error);
    return false;
  }
};

// 初始化素材
exports.initializeMaterials = async (req, res) => {
  try {
    console.log('开始初始化素材库...');
    
    // 确保文件类型已初始化
    await exports.initializeFileTypes();
    
    const settings = await Setting.findOne();
    console.log('获取设置:', settings);
    
    if (!settings || !settings.materialRootPath) {
      console.log('错误: 未配置素材根路径');
      return res.status(400).json({ message: '请先设置素材根路径' });
    }
    
    console.log('素材根路径:', settings.materialRootPath);
    
    // 检查根路径是否存在
    if (!(await fs.pathExists(settings.materialRootPath))) {
      console.log('错误: 素材根路径不存在:', settings.materialRootPath);
      return res.status(400).json({ message: '素材根路径不存在' });
    }
    
    const results = {
      total: 0,
      processed: 0,
      errors: []
    };
    
    // 检查 images 目录
    const imagesPath = path.join(settings.materialRootPath, 'images');
    console.log('图片目录路径:', imagesPath);
    const imagesExists = await fs.pathExists(imagesPath);
    console.log('图片目录存在:', imagesExists);
    
    // 处理图片文件
    if (imagesExists) {
      console.log('开始处理图片文件...');
      const imageResults = await processImageFiles(settings.materialRootPath);
      console.log('图片处理结果:', imageResults);
      results.total += imageResults.total;
      results.processed += imageResults.processed;
      results.errors = [...results.errors, ...imageResults.errors];
    } else {
      console.log('警告: images 目录不存在');
      results.errors.push('images 目录不存在');
    }
    
    // 检查 videos 目录
    const videosPath = path.join(settings.materialRootPath, 'videos');
    console.log('视频目录路径:', videosPath);
    const videosExists = await fs.pathExists(videosPath);
    console.log('视频目录存在:', videosExists);
    
    // 处理视频文件
    if (videosExists) {
      console.log('开始处理视频文件...');
      const videoResults = await processVideoFiles(settings.materialRootPath);
      console.log('视频处理结果:', videoResults);
      results.total += videoResults.total;
      results.processed += videoResults.processed;
      results.errors = [...results.errors, ...videoResults.errors];
    } else {
      console.log('警告: videos 目录不存在');
      results.errors.push('videos 目录不存在');
    }
    
    console.log('初始化素材库完成, 结果:', results);
    return res.status(200).json(results);
  } catch (error) {
    console.error('初始化素材失败:', error);
    return res.status(500).json({ message: '初始化素材失败', error: error.message });
  }
};

// 处理图片文件（3层结构）
async function processImageFiles(rootPath) {
  const results = {
    total: 0,
    processed: 0,
    errors: []
  };
  
  try {
    const imagesPath = path.join(rootPath, 'images');
    console.log('处理图片文件, 路径:', imagesPath);
    
    const brands = await Brand.find();
    console.log('找到品牌数量:', brands.length);
    
    const imageFileType = await FileType.findOne({ name: 'image' });
    
    if (!imageFileType) {
      console.log('错误: 未找到图片文件类型配置');
      results.errors.push('未找到图片文件类型配置');
      return results;
    }
    
    // 处理每个品牌的图片
    for (const brand of brands) {
      try {
        console.log('处理品牌:', brand.name, '路径:', brand.path);
        
        if (!(await fs.pathExists(brand.path))) {
          console.log('错误: 品牌路径不存在:', brand.path);
          results.errors.push(`品牌 ${brand.name} 的路径不存在`);
          continue;
        }
        
        // 读取品牌文件夹下的所有文件
        const files = await fs.readdir(brand.path);
        console.log('品牌文件夹下文件数量:', files.length);
        
        for (const fileName of files) {
          const fullPath = path.join(brand.path, fileName);
          const stats = await fs.stat(fullPath);
          
          // 只处理文件（图片）
          if (stats.isFile() && imageFileType.extensions.includes(path.extname(fileName).toLowerCase())) {
            results.total++;
            
            try {
              // 生成唯一 key
              const key = `image_${brand.name}_${fileName}`;
              
              // 检查图片是否已存在
              const existingFile = await File.findOne({ key });
              
              if (!existingFile) {
                // 如果不存在，则创建新图片记录
                await File.create({
                  key,
                  type: 'image',
                  brand: brand.name,
                  name: fileName,
                  path: fullPath,
                  status: '未上传'
                });
                console.log('新增图片:', key);
              } else {
                console.log('图片已存在:', key);
              }
              
              results.processed++;
            } catch (error) {
              console.error('处理图片出错:', fileName, error);
              results.errors.push(`处理图片 ${brand.name}/${fileName} 失败: ${error.message}`);
            }
          } else {
            console.log('跳过非图片文件或目录:', fileName);
          }
        }
      } catch (error) {
        console.error('处理品牌出错:', brand.name, error);
        results.errors.push(`处理品牌 ${brand.name} 失败: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('处理图片文件出错:', error);
    results.errors.push(`处理图片文件失败: ${error.message}`);
  }
  
  return results;
}

// 处理视频文件（2层结构）
async function processVideoFiles(rootPath) {
  const results = {
    total: 0,
    processed: 0,
    errors: []
  };
  
  try {
    const videosPath = path.join(rootPath, 'videos');
    console.log('处理视频文件, 路径:', videosPath);
    
    const videoFileType = await FileType.findOne({ name: 'video' });
    
    if (!videoFileType) {
      console.log('错误: 未找到视频文件类型配置');
      results.errors.push('未找到视频文件类型配置');
      return results;
    }
    
    if (!(await fs.pathExists(videosPath))) {
      console.log('错误: 视频目录不存在');
      results.errors.push('视频目录不存在');
      return results;
    }
    
    // 读取视频目录下的所有文件
    const files = await fs.readdir(videosPath);
    console.log('视频目录下文件数量:', files.length);
    
    for (const fileName of files) {
      const fullPath = path.join(videosPath, fileName);
      const stats = await fs.stat(fullPath);
      
      // 只处理文件（视频）
      if (stats.isFile() && videoFileType.extensions.includes(path.extname(fileName).toLowerCase())) {
        results.total++;
        
        try {
          // 生成唯一 key
          const key = `video_${fileName}`;
          
          // 检查视频是否已存在
          const existingFile = await File.findOne({ key });
          
          if (!existingFile) {
            // 如果不存在，则创建新视频记录
            await File.create({
              key,
              type: 'video',
              brand: '', // 视频没有品牌
              name: fileName,
              path: fullPath,
              status: '未上传'
            });
            console.log('新增视频:', key);
          } else {
            console.log('视频已存在:', key);
          }
          
          results.processed++;
        } catch (error) {
          console.error('处理视频出错:', fileName, error);
          results.errors.push(`处理视频 ${fileName} 失败: ${error.message}`);
        }
      } else {
        console.log('跳过非视频文件或目录:', fileName);
      }
    }
  } catch (error) {
    console.error('处理视频文件出错:', error);
    results.errors.push(`处理视频文件失败: ${error.message}`);
  }
  
  return results;
}

// 获取文件类型
exports.getFileTypes = async (req, res) => {
  try {
    // 确保文件类型已初始化
    await exports.initializeFileTypes();
    
    const fileTypes = await FileType.find();
    
    return res.status(200).json(fileTypes);
  } catch (error) {
    console.error('获取文件类型失败:', error);
    return res.status(500).json({ message: '获取文件类型失败', error: error.message });
  }
};

// 更新文件类型
exports.updateFileType = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, useWeightRules } = req.body;
    
    const fileType = await FileType.findByIdAndUpdate(
      id,
      { enabled, useWeightRules },
      { new: true }
    );
    
    if (!fileType) {
      return res.status(404).json({ message: '文件类型不存在' });
    }
    
    return res.status(200).json(fileType);
  } catch (error) {
    console.error('更新文件类型失败:', error);
    return res.status(500).json({ message: '更新文件类型失败', error: error.message });
  }
};

// 创建测试目录结构
exports.createTestDirectories = async (req, res) => {
  try {
    const { rootPath } = req.body;
    
    if (!rootPath) {
      return res.status(400).json({ message: '请提供根目录路径' });
    }
    
    // 确保根目录存在
    await fs.ensureDir(rootPath);
    
    // 创建 images 目录和品牌子目录
    const brands = ['Chanel', 'Dior', 'Gucci', 'LV', 'Prada', 'MiuMiu', 'YSL'];
    const imagesDir = path.join(rootPath, 'images');
    
    await fs.ensureDir(imagesDir);
    
    for (const brand of brands) {
      await fs.ensureDir(path.join(imagesDir, brand));
      console.log(`创建品牌目录: ${brand}`);
    }
    
    // 创建 videos 目录
    const videosDir = path.join(rootPath, 'videos');
    await fs.ensureDir(videosDir);
    
    return res.status(200).json({ 
      message: '测试目录结构创建成功',
      structure: {
        root: rootPath,
        images: imagesDir,
        videos: videosDir,
        brands
      }
    });
  } catch (error) {
    console.error('创建测试目录结构失败:', error);
    return res.status(500).json({ message: '创建测试目录结构失败', error: error.message });
  }
}; 