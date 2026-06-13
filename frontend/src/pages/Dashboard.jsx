import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Menu, Card, Button, Input, Form, List, Badge, message, Alert, Space, Typography, Row, Col, Table, Breadcrumb, Modal, Progress, Statistic } from 'antd'
import { 
  DashboardOutlined,
  GlobalOutlined, 
  DatabaseOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  FolderOpenOutlined,
  FileOutlined,
  DeleteOutlined,
  SaveOutlined,
  FolderAddOutlined,
  LockOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  AppstoreAddOutlined,
  MailOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState('0')
  
  // Data States
  const [sysInfo, setSysInfo] = useState({ cpu: 0, memory: 0, disk: 0, uptime: '0s' })
  const [domains, setDomains] = useState([])
  const [ftpUsers, setFtpUsers] = useState([])
  const [cronJobs, setCronJobs] = useState([])
  const [mailAccounts, setMailAccounts] = useState([])
  
  const [mysqlStatus, setMysqlStatus] = useState({ installed: false, message: 'Checking...' })
  const [phpStatus, setPhpStatus] = useState({ installed: false, message: 'Checking...' })
  const [mailStatus, setMailStatus] = useState({ installed: false, message: 'Checking...' })

  // Loading States
  const [loading, setLoading] = useState(false)
  const [installingMysql, setInstallingMysql] = useState(false)
  const [installingPhp, setInstallingPhp] = useState(false)
  const [installingFtp, setInstallingFtp] = useState(false)
  const [installingMail, setInstallingMail] = useState(false)
  const [issuingSsl, setIssuingSsl] = useState(false)
  const [installingWp, setInstallingWp] = useState(false)
  const [wpModalVisible, setWpModalVisible] = useState(false)
  const [wpCredentials, setWpCredentials] = useState(null)

  // Forms
  const [domainForm] = Form.useForm()
  const [dbForm] = Form.useForm()
  const [ftpForm] = Form.useForm()
  const [cronForm] = Form.useForm()
  const [mailForm] = Form.useForm()

  // File Manager state
  const [currentPath, setCurrentPath] = useState('/')
  const [fileItems, setFileItems] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isNewDirModalVisible, setIsNewDirModalVisible] = useState(false)
  const [newDirName, setNewDirName] = useState('')

  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      const [domRes, cronRes, ftpRes, mailRes, sysRes, mysqlRes, phpRes, mailStatRes] = await Promise.all([
        fetch('/api/domains').then(res => res.json()),
        fetch('/api/cron').then(res => res.json()),
        fetch('/api/ftp').then(res => res.json()),
        fetch('/api/mail/accounts').then(res => res.json()),
        fetch('/api/sysinfo').then(res => res.json()),
        fetch('/api/mysql/status').then(res => res.json()),
        fetch('/api/php/status').then(res => res.json()),
        fetch('/api/mail/status').then(res => res.json())
      ])
      
      if (domRes.data) setDomains(domRes.data)
      if (cronRes.data) setCronJobs(cronRes.data)
      if (ftpRes.data) setFtpUsers(ftpRes.data)
      if (mailRes.data) setMailAccounts(mailRes.data)
      if (sysRes.data) setSysInfo(sysRes.data)
      if (mysqlRes.data) setMysqlStatus(mysqlRes.data)
      if (phpRes.data) setPhpStatus(phpRes.data)
      if (mailStatRes.data) setMailStatus(mailStatRes.data)
    } catch (err) {
      console.error('Failed to fetch data', err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('mcp_token')
    navigate('/login')
  }

  const handleInstallMysql = async () => {
    setInstallingMysql(true)
    try {
      const res = await fetch('/api/mysql/install', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); fetchData() }
    } catch (err) { message.error('Network error') } 
    finally { setInstallingMysql(false) }
  }

  const handleInstallPhp = async () => {
    setInstallingPhp(true)
    try {
      const res = await fetch('/api/php/install', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); fetchData() }
    } catch (err) { message.error('Network error') } 
    finally { setInstallingPhp(false) }
  }

  const handleInstallFtp = async () => {
    setInstallingFtp(true)
    try {
        // ... (existing logic)
    } finally { setInstallingFtp(false) }
  }

  const handleInstallMail = async () => {
    setInstallingMail(true)
    try {
      const res = await fetch('/api/mail/install', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        message.success(data.message)
        fetchData()
      } else { message.error(data.message) }
    } catch (err) { message.error('Network error') }
    finally { setInstallingMail(false) }
  }

  const handleCreateMailAccount = async (values) => {
    setLoading(true)
    try {
      const res = await fetch('/api/mail/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (data.success) {
        message.success(data.message)
        mailForm.resetFields()
        fetchData()
      } else { message.error(data.message) }
    } catch (err) { message.error('Network error') }
    finally { setLoading(false) }
  }

  const handleAddDomain = async (values) => {
    setLoading(true)
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); domainForm.resetFields(); fetchData() }
    } catch (err) { message.error('Network error') } 
    finally { setLoading(false) }
  }

  const handleIssueSSL = async (domain_name) => {
    setIssuingSsl(true)
    try {
      const res = await fetch('/api/domains/ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_name })
      })
      const data = await res.json()
      if (data.success) { message.success(data.message) }
      else { message.error(data.message) }
    } catch (err) { message.error('Network error') } 
    finally { setIssuingSsl(false) }
  }

  const handleInstallWp = async (domain_name) => {
    setInstallingWp(true)
    try {
      const res = await fetch('/api/domains/install-wp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_name })
      })
      const data = await res.json()
      if (data.success) { 
        message.success(data.message)
        setWpCredentials({ dbName: data.dbName, dbUser: data.dbUser, dbPass: data.dbPass, domain: domain_name })
        setWpModalVisible(true)
      } else { message.error(data.message) }
    } catch (err) { message.error('Network error') } 
    finally { setInstallingWp(false) }
  }

  const handleCreateDatabase = async (values) => {
    setLoading(true)
    try {
      const res = await fetch('/api/mysql/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (data.success || data.status === 'success') { message.success(data.message); dbForm.resetFields() }
    } catch (err) { message.error('Network error') } 
    finally { setLoading(false) }
  }

  const handleAddFtpUser = async (values) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ftp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (data.status === 'success') { message.success('FTP User created'); ftpForm.resetFields(); fetchData() }
    } catch (err) { message.error('Network error') } 
    finally { setLoading(false) }
  }

  const handleAddCron = async (values) => {
    setLoading(true)
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (data.status === 'success') { message.success('Cron job scheduled'); cronForm.resetFields(); fetchData() }
      else message.error(data.message)
    } catch (err) { message.error('Network error') } 
    finally { setLoading(false) }
  }

  const handleDeleteCron = async (id) => {
    try {
      const res = await fetch(`/api/cron/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.status === 'success') { message.success('Job deleted'); fetchData() }
    } catch (err) { message.error('Network error') }
  }

  // --- FILE MANAGER LOGIC ---
  const fetchFiles = async (path) => {
    setFilesLoading(true)
    try {
      const res = await fetch(`/api/fs/list?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (data.status === 'success') setFileItems(data.data)
      else { message.error(data.message); setCurrentPath('/') }
    } catch (err) { message.error('Failed to load files') } 
    finally { setFilesLoading(false) }
  }

  const handleFileClick = async (record) => {
    const fullPath = currentPath === '/' ? `/${record.name}` : `${currentPath}/${record.name}`
    if (record.isDirectory) setCurrentPath(fullPath)
    else {
      try {
        const res = await fetch(`/api/fs/read?path=${encodeURIComponent(fullPath)}`)
        const data = await res.json()
        if (data.status === 'success') { setFileContent(data.data); setEditingFile(fullPath) }
      } catch (err) { message.error('Error reading file') }
    }
  }

  const saveFile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editingFile, content: fileContent })
      })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); setEditingFile(null) }
    } catch (err) { message.error('Error saving file') }
    finally { setLoading(false) }
  }

  const deleteItem = async (itemName) => {
    const fullPath = currentPath === '/' ? `/${itemName}` : `${currentPath}/${itemName}`
    try {
      const res = await fetch('/api/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath })
      })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); fetchFiles(currentPath) }
    } catch (err) { message.error('Error deleting item') }
  }


  const renderContent = () => {
    if (activeMenu === 'dashboard') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Title level={2} style={{ color: '#fff', marginTop: 0 }}>System Overview</Title>
          </Col>
          <Col xs={24} md={8}>
            <Card className="glass-panel" style={{ textAlign: 'center' }}>
              <Statistic title="CPU Usage" value={sysInfo?.cpu || 0} suffix="%" valueStyle={{ color: '#10b981' }} />
              <Progress type="dashboard" percent={sysInfo?.cpu || 0} strokeColor="#10b981" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="glass-panel" style={{ textAlign: 'center' }}>
              <Statistic title="RAM Usage" value={sysInfo?.memory || 0} suffix="%" valueStyle={{ color: '#3b82f6' }} />
              <Progress type="dashboard" percent={sysInfo?.memory || 0} strokeColor="#3b82f6" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="glass-panel" style={{ textAlign: 'center' }}>
              <Statistic title="Uptime" value={sysInfo?.uptime || 'Loading...'} valueStyle={{ color: '#f59e0b', fontSize: '24px' }} />
              <Card title="Background Services" bordered={false} className="glass-panel">
                <List>
                  <List.Item
                    actions={[
                      mysqlStatus?.installed ? <Badge status="success" text="Installed" /> : <Button size="small" type="primary" onClick={handleInstallMysql} loading={installingMysql}>Install MariaDB</Button>
                    ]}
                  >
                    <List.Item.Meta title="MariaDB Server" description={mysqlStatus?.message || "Not installed"} />
                  </List.Item>
                  <List.Item
                    actions={[
                      phpStatus?.installed ? <Badge status="success" text="Installed" /> : <Button size="small" type="primary" onClick={handleInstallPhp} loading={installingPhp}>Install PHP-FPM</Button>
                    ]}
                  >
                    <List.Item.Meta title="PHP 8.1 FPM" description={phpStatus?.message || "Not installed"} />
                  </List.Item>
                  <List.Item
                    actions={[
                      <Button size="small" type="primary" onClick={handleInstallFtp} loading={installingFtp}>Reinstall VSFTPD</Button>
                    ]}
                  >
                    <List.Item.Meta title="FTP Server" description="vsftpd server" />
                  </List.Item>
                  <List.Item
                    actions={[
                      mailStatus?.installed ? <Badge status="success" text="Installed" /> : <Button size="small" type="primary" onClick={handleInstallMail} loading={installingMail}>Install Postfix/Dovecot</Button>
                    ]}
                  >
                    <List.Item.Meta title="Mail Server" description={mailStatus?.message || "Postfix & Dovecot"} />
                  </List.Item>
                </List>
              </Card>
            </Card>
          </Col>
        </Row>
      )
    }

    if (activeMenu === 'mail') {
      return (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {!mailStatus?.installed ? (
              <Alert 
                message="Mail Server Not Installed" 
                description="You need to install the Postfix and Dovecot mail stack first."
                type="warning" 
                showIcon 
                action={<Button type="primary" onClick={handleInstallMail} loading={installingMail}>Install Mail Server</Button>}
              />
            ) : (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                  <Card title="Create Mailbox" bordered={false} className="glass-panel">
                    <Form form={mailForm} layout="vertical" onFinish={handleCreateMailAccount}>
                      <Form.Item name="prefix" label="Email Name" rules={[{ required: true }]}>
                        <Input addonAfter="@" placeholder="admin" />
                      </Form.Item>
                      <Form.Item name="domain" label="Select Domain" rules={[{ required: true }]}>
                        <Select placeholder="Select a domain">
                          {domains.map(d => (
                            <Select.Option key={d.id} value={d.domain_name}>{d.domain_name}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                        <Input.Password prefix={<LockOutlined />} />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading} block>Create Mailbox</Button>
                    </Form>
                  </Card>
                  
                  <Card title="Email Client Settings" bordered={false} className="glass-panel" style={{ marginTop: 16 }}>
                    <p><b>Incoming (IMAP):</b> port 143 (STARTTLS)</p>
                    <p><b>Incoming (POP3):</b> port 110 (STARTTLS)</p>
                    <p><b>Outgoing (SMTP):</b> port 587 (STARTTLS)</p>
                    <p><Text type="secondary">Username is your full email address.</Text></p>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card title="Mail Accounts" bordered={false} className="glass-panel">
                    <List
                      dataSource={mailAccounts}
                      renderItem={(item) => (
                        <List.Item actions={[<Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>]}>
                          <List.Item.Meta
                            avatar={<MailOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                            title={<Text strong style={{ color: '#e2e8f0' }}>{item.email}</Text>}
                            description={`Domain: ${item.domain} | Created: ${new Date(item.created_at).toLocaleDateString()}`}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      )
    }

    return null
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={250} className="glass-panel" style={{ borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
          {collapsed ? 'MCP' : <><span style={{ color: '#3b82f6', marginRight: 4 }}>My</span>ControlPanel</>}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeMenu]} onSelect={({ key }) => setActiveMenu(key)} items={[
          { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
          { key: 'websites', icon: <GlobalOutlined />, label: 'Websites' },
          { key: 'files', icon: <FolderOpenOutlined />, label: 'File Manager' },
          { key: 'databases', icon: <DatabaseOutlined />, label: 'Databases' },
          { key: 'ftp', icon: <FolderAddOutlined />, label: 'FTP Accounts' },
          { key: 'mail', icon: <MailOutlined />, label: 'Mail Server' },
          { key: 'cron', icon: <ClockCircleOutlined />, label: 'Cron Jobs' },
          { key: 'settings', icon: <SettingOutlined />, label: 'Settings' }
        ]} />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="glass-panel" >
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64, color: '#fff' }} />
          <div style={{ paddingRight: 24 }}><Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: '#fff' }}>Logout</Button></div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, maxWidth: 1200 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}
