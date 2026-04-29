import React from 'react';
import { Layout, Card, Table, Button, Space } from 'antd';

const { Header, Content } = Layout;

const PendingApprovalsPage = () => {
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Business', dataIndex: 'business', key: 'business' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="primary" size="small">Approve</Button>
          <Button danger size="small">Reject</Button>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <Header style={{ background: '#001529', color: 'white' }}>
        <h2 style={{ margin: 0 }}>Pending Approvals</h2>
      </Header>

      <Content style={{ padding: '20px' }}>
        <Card>
          <Table dataSource={[]} columns={columns} />
        </Card>
      </Content>
    </Layout>
  );
};

export default PendingApprovalsPage;
