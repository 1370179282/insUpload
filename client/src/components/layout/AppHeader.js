import React from 'react';
import { Layout, Typography } from 'antd';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = () => {
  return (
    <Header style={{ background: '#fff', padding: '0 24px' }}>
      <Title level={3} style={{ margin: '16px 0' }}>文件控制系统</Title>
    </Header>
  );
};

export default AppHeader; 