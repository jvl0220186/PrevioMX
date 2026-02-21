import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthProvider'
import AppRoutes from './routes/AppRoutes'
import './styles/App.css'

function App() {
  return (
    <BrowserRouter basename="/PrevioMX">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

