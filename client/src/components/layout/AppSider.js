import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { HomeOutlined, SettingOutlined, FileOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

const AppSider = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const items = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      key: '/images',
      icon: <FileOutlined />,
      label: '文件管理',
    },
  ];

  const handleMenuClick = (e) => {
    navigate(e.key);
  };
  
  return (
    <Sider 
      collapsible 
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={200}
      style={{ background: '#fff' }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default AppSider; 