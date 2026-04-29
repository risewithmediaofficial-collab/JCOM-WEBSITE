import React from 'react';
import { Layout, Card, Descriptions, Button, Space } from 'antd';

const { Header, Content } = Layout;

const ProfilePage = () => {
  return (
    <Layout>
      <Header style={{ background: '#001529', color: 'white' }}>
        <h2 style={{ margin: 0 }}>Profile</h2>
      </Header>

      <Content style={{ padding: '20px' }}>
        <Card>
          <Descriptions title="Member Profile" bordered column={1}>
            <Descriptions.Item label="Name">-</Descriptions.Item>
            <Descriptions.Item label="Email">-</Descriptions.Item>
            <Descriptions.Item label="Business">-</Descriptions.Item>
            <Descriptions.Item label="Location">-</Descriptions.Item>
            <Descriptions.Item label="Membership ID">-</Descriptions.Item>
          </Descriptions>

          <Space style={{ marginTop: '20px' }}>
            <Button type="primary">Edit Profile</Button>
            <Button>Change Password</Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default ProfilePage;
