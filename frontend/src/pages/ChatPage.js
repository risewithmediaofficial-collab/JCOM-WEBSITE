import React from 'react';
import { Layout, Card, Input, Button, Space, List } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

const ChatPage = () => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');

  return (
    <Layout>
      <Header style={{ background: '#001529', color: 'white' }}>
        <h2 style={{ margin: 0 }}>Chat</h2>
      </Header>

      <Content style={{ padding: '20px' }}>
        <Card style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            <List
              dataSource={messages}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </div>

          <Space style={{ width: '100%' }}>
            <Input 
              placeholder="Type your message..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => {
                if (input.trim()) {
                  setMessages([...messages, input]);
                  setInput('');
                }
              }}
            />
            <Button type="primary" icon={<SendOutlined />}>Send</Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default ChatPage;
