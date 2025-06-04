import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, message, Statistic, Select } from 'antd';
import { CloudUploadOutlined, FileOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { getFiles, generateQueue, completeUpload, getSettings, getFileTypes } from '../api';

const { Option } = Select;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [generatingQueue, setGeneratingQueue] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
    imageTotal: 0,
    videoTotal: 0
  });
  const [currentFile, setCurrentFile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [fileTypes, setFileTypes] = useState([]);
  const [selectedFileType, setSelectedFileType] = useState(null);

  useEffect(() => {
    fetchStatistics();
    fetchSettings();
    fetchFileTypes();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
      setSelectedFileType(response.data.defaultFileType);
    } catch (error) {
      console.error('获取设置失败:', error);
      message.error('获取设置失败');
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

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const pendingRes = await getFiles({ status: '未上传' });
      const uploadedRes = await getFiles({ status: '已上传' });
      const imageRes = await getFiles({ type: 'image' });
      const videoRes = await getFiles({ type: 'video' });
      
      setStatistics({
        pending: pendingRes.data.pagination.total,
        uploaded: uploadedRes.data.pagination.total,
        total: pendingRes.data.pagination.total + uploadedRes.data.pagination.total,
        imageTotal: imageRes.data.pagination.total,
        videoTotal: videoRes.data.pagination.total
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
      message.error('获取统计信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQueue = async () => {
    try {
      setGeneratingQueue(true);
      const response = await generateQueue(selectedFileType);
      setCurrentFile(response.data.file);
      message.success('成功生成文件队列');
    } catch (error) {
      console.error('生成队列失败:', error);
      message.error(error.response?.data?.message || '生成队列失败');
    } finally {
      setGeneratingQueue(false);
    }
  };

  const handleCompleteUpload = async () => {
    if (!currentFile) {
      return message.warning('没有正在处理的文件');
    }

    try {
      setLoading(true);
      await completeUpload(currentFile._id);
      message.success('上传完成，已标记为已上传状态');
      setCurrentFile(null);
      fetchStatistics();
    } catch (error) {
      console.error('完成上传失败:', error);
      message.error(error.response?.data?.message || '完成上传失败');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeIcon = (type) => {
    if (type === 'image') return <PictureOutlined />;
    if (type === 'video') return <VideoCameraOutlined />;
    return <FileOutlined />;
  };

  const getFileTypeName = (type) => {
    if (type === 'image') return '图片';
    if (type === 'video') return '视频';
    if (type === 'both') return '图片和视频';
    return '文件';
  };

  return (
    <div>
      <h2>任务队列</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={statistics.total}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="图片数量"
              value={statistics.imageTotal}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="视频数量"
              value={statistics.videoTotal}
              prefix={<VideoCameraOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未上传"
              value={statistics.pending}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="当前队列">
        {currentFile ? (
          <div>
            <p>类型: {getFileTypeName(currentFile.type)}</p>
            {currentFile.brand && <p>品牌: {currentFile.brand}</p>}
            <p>文件名: {currentFile.name}</p>
            <Button 
              type="primary" 
              onClick={handleCompleteUpload}
              loading={loading}
              icon={<CloudUploadOutlined />}
            >
              完成上传
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p>当前没有处理中的文件</p>
            <div style={{ marginBottom: 16 }}>
              <Select 
                style={{ width: 200, marginRight: 16 }} 
                placeholder="选择文件类型"
                value={selectedFileType}
                onChange={(value) => setSelectedFileType(value)}
              >
                <Option value="image">仅图片</Option>
                <Option value="video">仅视频</Option>
                <Option value="both">图片和视频</Option>
              </Select>
              <Button
                type="primary"
                onClick={handleGenerateQueue}
                loading={generatingQueue}
              >
                生成文件队列
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard; 