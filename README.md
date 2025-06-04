# 文件控制系统

基于 Node.js + MongoDB + React + Ant Design 的文件控制系统

## 功能介绍

1. **系统配置模块**
   - 配置输出文件路径和素材根目录
   - 读取品牌文件夹并初始化素材库
   - 设置品牌权重

2. **任务队列模块**
   - 按照权重概率生成图片队列
   - 将图片复制到指定输出目录
   - 标记图片上传状态

3. **图片管理模块**
   - 按品牌和状态筛选图片
   - 批量处理图片状态（已上传/未上传）

## 系统要求

- Node.js 14+
- MongoDB 4.4+

## 目录结构

```
├── client/              # 前端 React 项目
└── server/              # 后端 Node.js 项目
    ├── config/          # 配置文件
    ├── controllers/     # 控制器
    ├── models/          # 数据模型
    └── routes/          # 路由
```

## 使用方法

1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

2. 配置 MongoDB

确保 MongoDB 已启动，默认连接到 `mongodb://localhost:27017/fileManager`

3. 启动开发服务器

```bash
# 进入后端目录
cd ../server

# 同时启动前端和后端
npm run dev
```

4. 访问应用

前端: http://localhost:3000
后端 API: http://localhost:5000/api

## 使用流程

1. 配置素材根目录和输出路径
2. 点击"读取品牌文件夹"获取品牌列表
3. 点击"初始化素材库"导入所有图片
4. 调整品牌权重
5. 在首页生成图片队列并处理上传 