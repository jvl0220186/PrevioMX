import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/auth/LoginForm'
import './LoginView.css'

const LoginView = () => {
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-view">
      <div className="login-container">
        <h1 className="login-title">PrevioMX</h1>
        <LoginForm onSubmit={handleLogin} error={error} loading={loading} />
      </div>
    </div>
  )
}

export default LoginView

