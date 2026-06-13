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
  SafetyCertificateOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState('0')
  
  // Data States
  const [sysInfo, setSysInfo] = useState(null)
  const [domains, setDomains] = useState([])
  const [ftpUsers, setFtpUsers] = useState([])
  const [cronJobs, setCronJobs] = useState([])
  
  const [mysqlStatus, setMysqlStatus] = useState({ installed: false, message: 'Checking...' })
  const [phpStatus, setPhpStatus] = useState({ installed: false, message: 'Checking...' })

  // Loading States
  const [loading, setLoading] = useState(false)
  const [installingMysql, setInstallingMysql] = useState(false)
  const [installingPhp, setInstallingPhp] = useState(false)
  const [installingFtp, setInstallingFtp] = useState(false)
  const [issuingSsl, setIssuingSsl] = useState(false)

  // Forms
  const [domainForm] = Form.useForm()
  const [dbForm] = Form.useForm()
  const [ftpForm] = Form.useForm()
  const [cronForm] = Form.useForm()

  // File Manager state
  const [currentPath, setCurrentPath] = useState('/')
  const [fileItems, setFileItems] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isNewDirModalVisible, setIsNewDirModalVisible] = useState(false)
  const [newDirName, setNewDirName] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    fetchSysInfo()
    const interval = setInterval(fetchSysInfo, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeMenu === '1') fetchDomains()
    if (activeMenu === '2') fetchMysqlStatus()
    if (activeMenu === '3') fetchFtpUsers()
    if (activeMenu === '4') fetchCronJobs()
    if (activeMenu === '5') fetchFiles(currentPath)
    if (activeMenu === '6') fetchPhpStatus()
  }, [activeMenu, currentPath])

  const handleLogout = () => {
    localStorage.removeItem('mcp_token')
    navigate('/login')
  }

  // --- API FETCHERS ---
  const fetchSysInfo = async () => {
    try {
      const res = await fetch('/api/sysinfo')
      const data = await res.json()
      if (data.status === 'success') setSysInfo(data.data)
    } catch (err) { }
  }

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains')
      const data = await res.json()
      if (data.status === 'success') setDomains(data.data)
    } catch (err) { }
  }

  const fetchMysqlStatus = async () => {
    try {
      const res = await fetch('/api/mysql/status')
      const data = await res.json()
      if (data.status === 'success') setMysqlStatus(data.data)
    } catch (err) { }
  }

  const fetchPhpStatus = async () => {
    try {
      const res = await fetch('/api/php/status')
      const data = await res.json()
      if (data.status === 'success') setPhpStatus(data.data)
    } catch (err) { }
  }

  const fetchFtpUsers = async () => {
    try {
      const res = await fetch('/api/ftp')
      const data = await res.json()
      if (data.status === 'success') setFtpUsers(data.data)
    } catch (err) { }
  }

  const fetchCronJobs = async () => {
    try {
      const res = await fetch('/api/cron')
      const data = await res.json()
      if (data.status === 'success') setCronJobs(data.data)
    } catch (err) { }
  }

  // --- ACTION HANDLERS ---
  const installMysql = async () => {
    setInstallingMysql(true)
    try {
      const res = await fetch('/api/mysql/install', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); fetchMysqlStatus() }
    } catch (err) { message.error('Network error') } 
    finally { setInstallingMysql(false) }
  }

  const installPhp = async () => {
    setInstallingPhp(true)
    try {
      const res = await fetch('/api/php/install', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') { message.success(data.message); fetchPhpStatus() }
    } catch (err) { message.error('Network error') } 
    finally { setInstallingPhp(false) }
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
      if (data.status === 'success') { message.success(data.message); domainForm.resetFields(); fetchDomains() }
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
      if (data.status === 'success') { message.success('FTP User created'); ftpForm.resetFields(); fetchFtpUsers() }
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
      if (data.status === 'success') { message.success('Cron job scheduled'); cronForm.resetFields(); fetchCronJobs() }
      else message.error(data.message)
    } catch (err) { message.error('Network error') } 
    finally { setLoading(false) }
  }

  const handleDeleteCron = async (id) => {
    try {
      const res = await fetch(`/api/cron/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.status === 'success') { message.success('Job deleted'); fetchCronJobs() }
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
    if (activeMenu === '0') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Title level={2} style={{ color: '#fff', marginTop: 0 }}>System Overview</Title>
          </Col>
          <Col xs={24} md={8}>
            <Card className="glass-panel" style={{ textAlign: 'center' }}>
              <Statistic title="CPU Usage" value={sysInfo?.cpuUsage || 0} suffix="%" valueStyle={{ color: '#10b981' }} />
              <Progress type="dashboard" percent={sysInfo?.cpuUsage || 0} strokeColor="#10b981" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="glass-panel" style={{ textAlign: 'center' }}>
              <Statistic title="RAM Usage" value={sysInfo?.usedMemGB || 0} suffix={`/ ${sysInfo?.totalMemGB || 0} GB`} valueStyle={{ color: '#3b82f6' }} />
              <Progress type="dashboard" percent={sysInfo?.memUsage || 0} strokeColor="#3b82f6" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="glass-panel" style={{ textAlign: 'center' }}>
              <Statistic title="Uptime" value={sysInfo?.uptime || 'Loading...'} valueStyle={{ color: '#f59e0b', fontSize: '24px' }} />
              <div style={{ marginTop: 20 }}>
                <Text type="secondary">OS: {sysInfo?.os}</Text>
              </div>
            </Card>
          </Col>
        </Row>
      )
    }

    if (activeMenu === '1') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Add New Website" bordered={false} className="glass-panel">
              <Form form={domainForm} onFinish={handleAddDomain} layout="inline">
                <Form.Item name="domain_name" rules={[{ required: true }]}>
                  <Input placeholder="mysite.com" prefix={<GlobalOutlined />} />
                </Form.Item>
                <Button className="btn-gradient" htmlType="submit" icon={<PlusOutlined />} loading={loading}>Add Domain</Button>
              </Form>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Hosted Domains" bordered={false} className="glass-panel">
              <List
                dataSource={domains}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button size="small" type="dashed" icon={<SafetyCertificateOutlined />} onClick={() => handleIssueSSL(item.domain_name)} loading={issuingSsl}>Enable SSL</Button>,
                      <Badge status="success" text="Active" />
                    ]}
                  >
                    <List.Item.Meta
                      title={<Text strong style={{ color: '#e2e8f0' }}>{item.domain_name}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )
    }

    if (activeMenu === '2') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Alert
              message={`MySQL Status: ${mysqlStatus.message}`}
              type={mysqlStatus.installed ? "success" : "warning"}
              action={!mysqlStatus.installed && <Button size="small" className="btn-gradient" onClick={installMysql} loading={installingMysql}>Install MariaDB</Button>}
            />
          </Col>
          <Col span={24}>
            <Card title="Create Database" bordered={false} className="glass-panel">
              <Form form={dbForm} onFinish={handleCreateDatabase} layout="vertical">
                <Row gutter={24}>
                  <Col xs={24} md={12}><Form.Item name="dbName" label={<span style={{color:'#fff'}}>DB Name</span>}><Input disabled={!mysqlStatus.installed} /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="dbUser" label={<span style={{color:'#fff'}}>DB User</span>}><Input disabled={!mysqlStatus.installed} /></Form.Item></Col>
                </Row>
                <Form.Item name="dbPass" label={<span style={{color:'#fff'}}>Password</span>}><Input.Password disabled={!mysqlStatus.installed} /></Form.Item>
                <Button className="btn-success-gradient" htmlType="submit" loading={loading} disabled={!mysqlStatus.installed}>Create DB & User</Button>
              </Form>
            </Card>
          </Col>
        </Row>
      )
    }

    if (activeMenu === '3') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Create FTP Account" bordered={false} className="glass-panel">
              <Form form={ftpForm} onFinish={handleAddFtpUser} layout="vertical">
                <Form.Item name="username" label={<span style={{color:'#fff'}}>Username</span>} rules={[{ required: true }]}><Input prefix={<UserOutlined/>} /></Form.Item>
                <Form.Item name="password" label={<span style={{color:'#fff'}}>Password</span>} rules={[{ required: true }]}><Input.Password prefix={<LockOutlined/>} /></Form.Item>
                <Form.Item name="domain" label={<span style={{color:'#fff'}}>Target Website Folder</span>} rules={[{ required: true }]}>
                  <Input placeholder="mysite.com (User will be locked in this folder)" />
                </Form.Item>
                <Button className="btn-gradient" htmlType="submit" loading={loading}>Create FTP User</Button>
              </Form>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="FTP Users" bordered={false} className="glass-panel">
              <List
                dataSource={ftpUsers}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={<span style={{color: '#e2e8f0'}}>{item.username}</span>} description={<span style={{color: '#94a3b8'}}>Locked to: /var/www/{item.domain}</span>} />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )
    }

    if (activeMenu === '4') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Add Cron Job" bordered={false} className="glass-panel">
              <Form form={cronForm} onFinish={handleAddCron} layout="vertical">
                <Form.Item name="schedule" label={<span style={{color:'#fff'}}>Schedule (Cron Expression)</span>} rules={[{ required: true }]}><Input placeholder="* * * * *" /></Form.Item>
                <Form.Item name="command" label={<span style={{color:'#fff'}}>Command</span>} rules={[{ required: true }]}><Input placeholder="php /var/www/mysite.com/cron.php" /></Form.Item>
                <Button className="btn-gradient" htmlType="submit" loading={loading}>Schedule Job</Button>
              </Form>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Active Cron Jobs" bordered={false} className="glass-panel">
              <List
                dataSource={cronJobs}
                renderItem={(item) => (
                  <List.Item actions={[<Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteCron(item.id)} />]}>
                    <List.Item.Meta title={<span style={{color: '#e2e8f0', fontFamily: 'monospace'}}>{item.schedule}</span>} description={<span style={{color: '#94a3b8'}}>{item.command}</span>} />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )
    }

    if (activeMenu === '5') {
      const fileColumns = [
        {
          title: 'Name',
          dataIndex: 'name',
          render: (text, record) => (
            <Space style={{ cursor: 'pointer' }} onClick={() => handleFileClick(record)}>
              {record.isDirectory ? <FolderOpenOutlined style={{ color: '#fbbf24' }} /> : <FileOutlined style={{ color: '#94a3b8' }} />}
              <span style={{ color: '#e2e8f0', fontWeight: record.isDirectory ? 'bold' : 'normal' }}>{text}</span>
            </Space>
          ),
        },
        { title: 'Size', dataIndex: 'size', render: (size, record) => record.isDirectory ? '-' : `${(size / 1024).toFixed(2)} KB` },
        { title: 'Actions', render: (_, record) => (<Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); deleteItem(record.name); }} />) }
      ]

      const breadcrumbs = currentPath.split('/').filter(Boolean).reduce((acc, curr, index, arr) => {
        acc.push({ title: <a onClick={() => setCurrentPath('/' + arr.slice(0, index + 1).join('/'))}>{curr}</a> })
        return acc
      }, [{ title: <a onClick={() => setCurrentPath('/')}><GlobalOutlined /> root</a> }])

      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="File Manager" bordered={false} className="glass-panel" extra={<Button type="primary" icon={<FolderAddOutlined />} onClick={() => setIsNewDirModalVisible(true)}>New Folder</Button>}>
              <Breadcrumb items={breadcrumbs} style={{ marginBottom: 16, background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: 8 }} />
              <Table columns={fileColumns} dataSource={fileItems} rowKey="name" loading={filesLoading} pagination={false} size="small" style={{ background: 'transparent' }} rowClassName={() => 'file-row'} />
            </Card>
          </Col>

          <Modal title={`Editing: ${editingFile}`} open={!!editingFile} onCancel={() => setEditingFile(null)} width={800} footer={[
            <Button key="cancel" onClick={() => setEditingFile(null)}>Cancel</Button>,
            <Button key="save" className="btn-gradient" icon={<SaveOutlined />} loading={loading} onClick={saveFile}>Save Changes</Button>,
          ]}>
            <TextArea rows={20} value={fileContent} onChange={(e) => setFileContent(e.target.value)} style={{ fontFamily: 'monospace', background: '#0b0f19', color: '#10b981', border: 'none' }} />
          </Modal>

          <Modal title="Create New Folder" open={isNewDirModalVisible} onOk={() => {
            fetch('/api/fs/mkdir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: currentPath === '/' ? `/${newDirName}` : `${currentPath}/${newDirName}` }) })
              .then(() => { setIsNewDirModalVisible(false); fetchFiles(currentPath); setNewDirName('') })
          }} onCancel={() => setIsNewDirModalVisible(false)}>
            <Input placeholder="folder_name" value={newDirName} onChange={(e) => setNewDirName(e.target.value)} />
          </Modal>
        </Row>
      )
    }

    if (activeMenu === '6') {
      return (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="System Settings" bordered={false} className="glass-panel">
              <Alert message={`PHP Status: ${phpStatus.message}`} type={phpStatus.installed ? "success" : "warning"} action={!phpStatus.installed && <Button size="small" className="btn-gradient" onClick={installPhp} loading={installingPhp}>Install PHP-FPM</Button>} />
            </Card>
          </Col>
        </Row>
      )
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={250} className="glass-panel" style={{ borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
          {collapsed ? 'MCP' : <><span style={{ color: '#3b82f6', marginRight: 4 }}>My</span>ControlPanel</>}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeMenu]} onSelect={({ key }) => setActiveMenu(key)} items={[
          { key: '0', icon: <DashboardOutlined />, label: 'Overview' },
          { key: '1', icon: <GlobalOutlined />, label: 'Websites' },
          { key: '2', icon: <DatabaseOutlined />, label: 'Databases' },
          { key: '3', icon: <UserOutlined />, label: 'FTP Accounts' },
          { key: '4', icon: <ClockCircleOutlined />, label: 'Cron Jobs' },
          { key: '5', icon: <FolderOpenOutlined />, label: 'File Manager' },
          { key: '6', icon: <SettingOutlined />, label: 'Settings' },
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
