import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', color: '#fff', background: '#080C18', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffb4ab', marginBottom: '8px' }}>Application Error</h2>
          <p style={{ fontSize: '14px', color: '#86939a', maxWidth: '400px', marginBottom: '16px' }}>
            {this.state.error?.message || "An unexpected rendering issue occurred."}
          </p>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/auth/login'; }}
            style={{ padding: '10px 20px', background: '#00c8ff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Reset App & Sign In
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />

          {/* Protected Dashboard Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
