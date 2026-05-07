import React from 'react';
import { Layout, Card, Table } from 'antd';

const { Header, Content } = Layout;

const DealsPage = () => {
  const columns = [
    { title: 'With', dataIndex: 'with', key: 'with' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Date', dataIndex: 'date', key: 'date' }
  ];

  return (
    <Layout>
      <Header style={{ background: '#001529', color: 'white' }}>
        <h2 style={{ margin: 0 }}>My Deals</h2>
      </Header>

      <Content style={{ padding: '20px' }}>
        <Card>
          <Table dataSource={[]} columns={columns} />
        </Card>
      </Content>
    </Layout>
  );
};

export default DealsPage;
