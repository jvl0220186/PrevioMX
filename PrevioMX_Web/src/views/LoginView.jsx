import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.js'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './LoginView.css'

const LoginView = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError('Por favor ingresa correo y contraseña')
      return
    }

    try {
      setLoading(true)
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      if (err.status === 401) {
        setError('Credenciales incorrectas')
      } else {
        setError(err.message || 'Ocurrió un error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-view">
      <div className="login-container">
        <div className="login-header">
          <h1>PrevioMX WEB</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Usuario / Correo</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Usuario o correo electrónico"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <LoadingSpinner size="small" color="white" /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginView
