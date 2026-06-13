import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function Setup() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Double check if setup is actually required
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && !data.requiresSetup) {
          navigate('/login')
        }
        setChecking(false)
      })
      .catch(() => {
        message.error('Failed to connect to backend')
        setChecking(false)
      })
  }, [navigate])

  const onFinish = async (values) => {
    if (values.password !== values.confirm) {
      return message.error('Passwords do not match!')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/setup/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password
        })
      })
      
      const data = await res.json()
      
      if (data.status === 'success') {
        message.success('Admin account created! Welcome to MyControlPanel.')
        localStorage.setItem('mcp_token', data.token)
        navigate('/')
      } else {
        message.error(data.message || 'Registration failed')
      }
    } catch (err) {
      message.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <Card 
        className="glass-panel"
        style={{ width: 450, textAlign: 'center' }}
      >
        <RocketOutlined style={{ fontSize: 48, color: '#3b82f6', marginBottom: 16 }} />
        <Title level={3} style={{ color: '#fff', marginBottom: 5 }}>Welcome to My<span style={{color: '#3b82f6'}}>ControlPanel</span></Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, color: '#94a3b8' }}>
          Let's set up your master administrator account.
        </Text>

        <Form
          name="setup"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input a username!' }]}
          >
            <Input prefix={<UserOutlined style={{color: '#94a3b8'}} />} placeholder="Admin Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input a strong password!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{color: '#94a3b8'}} />} placeholder="Strong Password" />
          </Form.Item>

          <Form.Item
            name="confirm"
            rules={[{ required: true, message: 'Please confirm your password!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{color: '#94a3b8'}} />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" className="btn-gradient" style={{ width: '100%', height: '45px', fontSize: '1.1rem' }} loading={loading}>
              Complete Setup
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
