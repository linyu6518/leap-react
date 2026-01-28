import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { loginAsync } from '@store/slices/authSlice'
import { TDInput } from '@components/shared'
import tdLogo from '@assets/td-logo.svg'
import './Login.scss'

// Custom solid exclamation icon for error alerts
const ExclamationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="7" fill="#AD1100"/>
    <path d="M7 3.5V7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7" cy="10" r="0.7" fill="white"/>
  </svg>
)

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth)

  const [username, setUsername] = useState('Maker')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // If already authenticated, redirect to dashboard or return URL
    if (isAuthenticated) {
      const returnUrl = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(returnUrl, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async () => {
    try {
      // Auto-login as maker if username is "Maker" and password is empty
      const loginUsername = username === 'Maker' && !password ? 'maker1' : username
      const loginPassword = username === 'Maker' && !password ? 'password' : password
      
      await dispatch(
        loginAsync({
          username: loginUsername,
          password: loginPassword,
        })
      ).unwrap()
      // Navigate to dashboard by default
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // Error is handled by Redux state
    }
  }

  const handleCancel = () => {
    setUsername('')
    setPassword('')
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="app-icon-wrapper">
              <img src={tdLogo} alt="TD Logo" className="app-icon" />
            </div>
            <div className="app-title-section">
              <h2 className="app-title">LEAP</h2>
              <p className="app-subtitle">Liquidity Explain & Analytics Platform</p>
            </div>
          </div>

          <div className="login-form">
            <div className="login-form-item">
              <TDInput
                placeholder="Username*"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                leading={{
                  content: <UserOutlined />,
                  type: 'icon'
                }}
                error={!username && error ? {
                  text: 'Username is required',
                  a11yDesc: 'Username is required'
                } : undefined}
              />
            </div>

            <div className="login-form-item">
              <TDInput
                placeholder="Password*"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                leading={{
                  content: <LockOutlined />,
                  type: 'icon'
                }}
                error={!password && error ? {
                  text: 'Password is required',
                  a11yDesc: 'Password is required'
                } : undefined}
              />
            </div>

            {error && (
              <Alert
                message="Login Failed"
                description="The username or password you entered is incorrect."
                type="error"
                showIcon
                icon={<ExclamationIcon />}
                className="error-message"
              />
            )}

            <div className="login-buttons">
              <Button
                onClick={handleCancel}
                className="cancel-button"
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                className="login-button"
                loading={loading}
                size="large"
              >
                Login
              </Button>
            </div>
          </div>

          <div className="leap-description">
            <p className="description-text">
              LEAP (Liquidity Explain & Analytics Platform) is a comprehensive platform designed to help financial institutions 
              analyze, explain, and manage liquidity risk. It provides advanced analytics, regulatory reporting capabilities, 
              and workflow management tools to support effective liquidity risk management and regulatory compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
