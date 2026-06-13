import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'

function App() {
  const [setupCheckDone, setSetupCheckDone] = useState(false)
  const [requiresSetup, setRequiresSetup] = useState(false)

  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.requiresSetup) {
          setRequiresSetup(true)
        }
      })
      .catch(console.error)
      .finally(() => setSetupCheckDone(true))
  }, [])

  const isAuthenticated = () => {
    return !!localStorage.getItem('mcp_token');
  };

  if (!setupCheckDone) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/setup" 
        element={requiresSetup ? <Setup /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/login" 
        element={requiresSetup ? <Navigate to="/setup" /> : (isAuthenticated() ? <Navigate to="/" /> : <Login />)} 
      />
      <Route 
        path="/" 
        element={requiresSetup ? <Navigate to="/setup" /> : (isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />)} 
      />
    </Routes>
  )
}

export default App
