import { useAuth } from '../contexts/AuthContext'
import Header from '../components/layout/Header'
import './DashboardView.css'

const DashboardView = () => {
  const { user } = useAuth()

  return (
    <div className="dashboard-view">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Bienvenido, {user?.name || user?.email}</h1>
          <p>Este es el dashboard principal de PrevioMX</p>
        </div>
      </main>
    </div>
  )
}

export default DashboardView

