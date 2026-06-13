import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      
      if (res.ok && data.status === 'success') {
        localStorage.setItem('mcp_token', data.token)
        message.success('Login successful!')
        navigate('/')
      } else {
        message.error(data.message || 'Login failed')
      }
    } catch (err) {
      message.error('Network error: Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <Card 
        className="glass-panel"
        style={{ width: 400, textAlign: 'center' }}
      >
        <Title level={3} style={{ color: '#fff', marginBottom: 5 }}>My<span style={{color: '#3b82f6'}}>ControlPanel</span></Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, color: '#94a3b8' }}>Welcome back, Administrator</Text>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined style={{color: '#94a3b8'}} />} placeholder="admin" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{color: '#94a3b8'}} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" className="btn-gradient" style={{ width: '100%', height: '45px', fontSize: '1.1rem' }} loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
