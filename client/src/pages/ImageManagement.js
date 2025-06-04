import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Button, message, Pagination, Space, Tag, Modal } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { getFiles, getAllBrands, updateFileStatus } from '../api';

const { Option } = Select;

const FileManagement = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchBrands();
    fetchFiles();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await getAllBrands();
      setBrands(response.data);
    } catch (error) {
      console.error('获取品牌失败:', error);
      message.error('获取品牌列表失败');
    }
  };

  const fetchFiles = async (page = 1, brand = selectedBrand, status = selectedStatus, type = selectedType) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.pageSize,
      };

      if (brand) {
        params.brand = brand;
      }

      if (status) {
        params.status = status;
      }
      
      if (type) {
        params.type = type;
      }

      const response = await getFiles(params);
      setFiles(response.data.files);
      setPagination({
        ...pagination,
        current: response.data.pagination.page,
        total: response.data.pagination.total,
      });
    } catch (error) {
      console.error('获取文件失败:', error);
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setSelectedRowKeys([]);
    fetchFiles(1, selectedBrand, selectedStatus, selectedType);
  };

  const handleResetFilter = () => {
    setSelectedBrand('');
    setSelectedStatus('');
    setSelectedType('');
    setSelectedRowKeys([]);
    fetchFiles(1, '', '', '');
  };

  const handlePageChange = (page) => {
    setSelectedRowKeys([]);
    fetchFiles(page, selectedBrand, selectedStatus, selectedType);
  };

  const handleUpdateStatus = async (status) => {
    if (selectedRowKeys.length === 0) {
      return message.warning('请先选择文件');
    }

    console.log('执行标记状态操作', status, selectedRowKeys);
    try {
      setLoading(true);
      await updateFileStatus(selectedRowKeys, status);
      message.success(`成功标记 ${selectedRowKeys.length} 个文件为${status}`);
      setSelectedRowKeys([]);
      fetchFiles(pagination.current, selectedBrand, selectedStatus, selectedType);
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('更新文件状态失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 220,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'image' ? 'blue' : 'purple'}>
          {type === 'image' ? <PictureOutlined /> : <VideoCameraOutlined />} {type === 'image' ? '图片' : '视频'}
        </Tag>
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === '已上传' ? 'green' : 'red'}>
          {status === '已上传' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {status}
        </Tag>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <h2>文件管理</h2>
      
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              style={{ width: 150 }}
              placeholder="按类型筛选"
              allowClear
              value={selectedType || undefined}
              onChange={(value) => setSelectedType(value)}
            >
              <Option value="image">图片</Option>
              <Option value="video">视频</Option>
            </Select>
            
            <Select
              style={{ width: 200 }}
              placeholder="按品牌筛选"
              allowClear
              value={selectedBrand || undefined}
              onChange={(value) => setSelectedBrand(value)}
            >
              {brands.map((brand) => (
                <Option key={brand.name} value={brand.name}>{brand.name}</Option>
              ))}
            </Select>
            
            <Select
              style={{ width: 150 }}
              placeholder="按状态筛选"
              allowClear
              value={selectedStatus || undefined}
              onChange={(value) => setSelectedStatus(value)}
            >
              <Option value="未上传">未上传</Option>
              <Option value="已上传">已上传</Option>
            </Select>
            
            <Button type="primary" onClick={handleFilter}>
              筛选
            </Button>
            
            <Button onClick={handleResetFilter}>
              重置
            </Button>
          </Space>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              type="primary"
              onClick={() => handleUpdateStatus('已上传')}
              disabled={selectedRowKeys.length === 0}
            >
              标记为已上传
            </Button>
            
            <Button 
              danger
              onClick={() => handleUpdateStatus('未上传')}
              disabled={selectedRowKeys.length === 0}
            >
              标记为未上传
            </Button>
            
            <span style={{ marginLeft: 8 }}>
              {selectedRowKeys.length > 0 ? `已选择 ${selectedRowKeys.length} 项` : ''}
            </span>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={files}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={false}
        />
        
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(total) => `共 ${total} 条记录`}
          />
        </div>
      </Card>
    </div>
  );
};

export default FileManagement; 