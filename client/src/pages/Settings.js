import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Table, InputNumber, message, Spin, Modal, Select, Switch, Tabs } from 'antd';
import { getSettings, updateSettings, readBrandFolders, updateBrandWeight, initializeMaterials, getFileTypes, updateFileType, createTestDirectories } from '../api';

const { Option } = Select;
const { TabPane } = Tabs;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [initLoading, setInitLoading] = useState(false);
  const [readingBrands, setReadingBrands] = useState(false);
  const [creatingDirs, setCreatingDirs] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchFileTypes();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await getSettings();
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('获取设置失败:', error);
      message.error('获取设置失败');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFileTypes = async () => {
    try {
      const response = await getFileTypes();
      setFileTypes(response.data);
    } catch (error) {
      console.error('获取文件类型失败:', error);
      message.error('获取文件类型失败');
    }
  };

  const handleSaveSettings = async (values) => {
    try {
      setLoading(true);
      // 处理Windows路径格式，将反斜杠转换为正斜杠
      const processedValues = {
        ...values,
        outputPath: values.outputPath.replace(/\\/g, '/'),
        materialRootPath: values.materialRootPath ? values.materialRootPath.replace(/\\/g, '/') : '',
        videoRootPath: values.videoRootPath ? values.videoRootPath.replace(/\\/g, '/') : ''
      };
      await updateSettings(processedValues);
      message.success('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error(error.response?.data?.message || '保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReadBrands = async () => {
    try {
      setReadingBrands(true);
      const response = await readBrandFolders();
      setBrands(response.data);
      message.success(`成功读取 ${response.data.length} 个品牌文件夹`);
    } catch (error) {
      console.error('读取品牌文件夹失败:', error);
      message.error(error.response?.data?.message || '读取品牌文件夹失败');
    } finally {
      setReadingBrands(false);
    }
  };

  const handleCreateTestDirectories = () => {
    const rootPath = form.getFieldValue('materialRootPath');
    
    if (!rootPath) {
      return message.error('请先设置素材根目录');
    }
    
    Modal.confirm({
      title: '创建测试目录结构',
      content: `将在 ${rootPath} 创建测试目录结构，包含 images/品牌 和 videos 文件夹。确定继续吗？`,
      onOk: async () => {
        try {
          setCreatingDirs(true);
          const response = await createTestDirectories(rootPath);
          message.success('测试目录结构创建成功');
          
          // 显示详细信息
          Modal.info({
            title: '目录结构创建成功',
            content: (
              <div>
                <p>根目录: {response.data.structure.root}</p>
                <p>图片目录: {response.data.structure.images}</p>
                <p>视频目录: {response.data.structure.videos}</p>
                <p>已创建的品牌目录:</p>
                <ul>
                  {response.data.structure.brands.map((brand, index) => (
                    <li key={index}>{brand}</li>
                  ))}
                </ul>
                <p>现在您需要:</p>
                <ol>
                  <li>将图片文件放入对应的品牌文件夹中</li>
                  <li>将视频文件放入 videos 文件夹中</li>
                  <li>点击"读取品牌文件夹"按钮</li>
                  <li>点击"初始化素材库"按钮</li>
                </ol>
              </div>
            ),
          });
        } catch (error) {
          console.error('创建测试目录结构失败:', error);
          message.error(error.response?.data?.message || '创建测试目录结构失败');
        } finally {
          setCreatingDirs(false);
        }
      },
    });
  };

  const handleInitializeMaterials = async () => {
    console.log('初始化素材库按钮被点击');
    try {
      console.log('开始初始化素材库');
      setInitLoading(true);
      console.log('发起API请求: initializeMaterials()');
      const response = await initializeMaterials();
      console.log('收到API响应:', response);
      
      // 即使没有处理任何文件也显示结果
      if (response.data.processed === 0) {
        console.log('未处理任何文件，显示提示');
        Modal.info({
          title: '初始化结果',
          content: (
            <div>
              <p>未处理任何文件</p>
              <p>可能的原因:</p>
              <ul>
                <li>素材根目录路径配置错误</li>
                <li>目录结构不符合预期 (应为 images/品牌/图片 和 videos/视频)</li>
                <li>目录中没有支持的文件类型</li>
              </ul>
              <p>错误信息:</p>
              <ul>
                {response.data.errors && response.data.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ),
        });
      } else {
        console.log(`成功处理 ${response.data.processed} 个文件`);
        message.success(`成功处理 ${response.data.processed} 个文件`);
        
        if (response.data.errors && response.data.errors.length > 0) {
          Modal.info({
            title: '处理过程中有些问题',
            content: (
              <div>
                <p>处理成功: {response.data.processed}</p>
                <p>总数: {response.data.total}</p>
                <p>错误信息:</p>
                <ul>
                  {response.data.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
          });
        }
      }
    } catch (error) {
      console.error('初始化素材失败:', error);
      Modal.error({
        title: '初始化素材失败',
        content: (
          <div>
            <p>{error.response?.data?.message || '无法连接到服务器'}</p>
            <p>详细错误: {error.message}</p>
          </div>
        ),
      });
    } finally {
      console.log('初始化素材库完成，重置loading状态');
      setInitLoading(false);
    }
  };

  const handleWeightChange = async (brandId, weight) => {
    try {
      await updateBrandWeight(brandId, weight);
      message.success('权重已更新');
      // 更新本地状态
      setBrands(prevBrands => 
        prevBrands.map(brand => 
          brand._id === brandId ? { ...brand, weight } : brand
        )
      );
    } catch (error) {
      console.error('更新权重失败:', error);
      message.error('更新权重失败');
    }
  };
  
  const handleFileTypeChange = async (fileTypeId, field, value) => {
    try {
      const data = { [field]: value };
      await updateFileType(fileTypeId, data);
      message.success('文件类型设置已更新');
      
      // 更新本地状态
      setFileTypes(prevFileTypes => 
        prevFileTypes.map(fileType => 
          fileType._id === fileTypeId ? { ...fileType, [field]: value } : fileType
        )
      );
    } catch (error) {
      console.error('更新文件类型失败:', error);
      message.error('更新文件类型失败');
    }
  };

  const brandColumns = [
    {
      title: '品牌名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '权重 (1-100)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight, record) => (
        <InputNumber
          min={1}
          max={100}
          defaultValue={weight}
          onBlur={(e) => handleWeightChange(record._id, e.target.value)}
        />
      ),
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
    },
  ];
  
  const fileTypeColumns = [
    {
      title: '文件类型',
      dataIndex: 'name',
      key: 'name',
      render: (name) => name === 'image' ? '图片' : name === 'video' ? '视频' : name,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleFileTypeChange(record._id, 'enabled', checked)}
        />
      ),
    },
    {
      title: '使用权重规则',
      dataIndex: 'useWeightRules',
      key: 'useWeightRules',
      render: (useWeightRules, record) => (
        <Switch
          checked={useWeightRules}
          onChange={(checked) => handleFileTypeChange(record._id, 'useWeightRules', checked)}
          disabled={record.name === 'video'} // 视频类型不使用权重规则
        />
      ),
    },
    {
      title: '支持的扩展名',
      dataIndex: 'extensions',
      key: 'extensions',
      render: (extensions) => extensions.join(', '),
    },
  ];

  return (
    <Spin spinning={loading}>
      <h2>系统设置</h2>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="基础配置" key="1">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveSettings}
              initialValues={{
                outputPath: '',
                materialRootPath: '',
                videoRootPath: '',
                queueSize: 100,
                defaultFileType: 'image'
              }}
            >
              <Form.Item
                name="outputPath"
                label="输出文件路径"
                rules={[{ required: true, message: '请输入输出文件路径' }]}
              >
                <Input placeholder="例如：/path/to/output 或 C:\path\to\output" />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  提示：Windows路径格式为 C:\path\to\folder，Mac/Linux路径格式为 /path/to/folder
                  <br />
                  注意：Windows路径可以使用正斜杠(/)替代反斜杠(\)，如 C:/path/to/folder
                </div>
              </Form.Item>
              
              <Form.Item
                name="materialRootPath"
                label="素材根目录"
                rules={[{ required: true, message: '请输入素材根目录' }]}
              >
                <Input placeholder="例如：/path/to/materials 或 C:\path\to\materials" />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  提示：路径需要真实存在，系统会在此路径下创建/查找 images 和 videos 目录
                  <br />
                  注意：Windows路径可以使用正斜杠(/)替代反斜杠(\)，如 C:/path/to/folder
                </div>
              </Form.Item>
              
              <Form.Item
                name="queueSize"
                label="队列大小"
                rules={[{ required: true, message: '请输入队列大小' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="defaultFileType"
                label="默认文件类型"
                rules={[{ required: true, message: '请选择默认文件类型' }]}
              >
                <Select>
                  <Option value="image">仅图片</Option>
                  <Option value="video">仅视频</Option>
                  <Option value="both">图片和视频</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  保存设置
                </Button>
                <Button 
                  style={{ marginLeft: 16 }}
                  onClick={handleCreateTestDirectories}
                  loading={creatingDirs}
                >
                  创建测试目录结构
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="品牌管理" key="2">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                onClick={handleReadBrands} 
                loading={readingBrands}
                style={{ marginRight: 16 }}
              >
                读取品牌文件夹
              </Button>
              <Button 
                type="primary"
                onClick={handleInitializeMaterials} 
                loading={initLoading}
                danger
              >
                初始化素材库
              </Button>
            </div>
            
            <Table
              columns={brandColumns}
              dataSource={brands}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="文件类型" key="3">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <p><strong>注意：</strong>文件类型的设置会影响生成队列时的选择规则。</p>
              <ul>
                <li><strong>图片类型</strong>：启用"使用权重规则"后，系统会根据品牌权重的比例选择图片</li>
                <li><strong>视频类型</strong>：不使用权重规则，始终随机选择</li>
              </ul>
              <p>每次修改设置后，系统会立即保存修改，无需额外点击保存按钮。</p>
            </div>
            <Table
              columns={fileTypeColumns}
              dataSource={fileTypes}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  );
};

export default Settings; 