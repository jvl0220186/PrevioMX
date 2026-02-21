
import './Header.css'

const getAppBasePath = () => {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

const Header = ({
  pendingCount = 0,
  title = "Sistema de Captura de Previos",
  subtitle = "Previos MX",
  showBack = false,
  onBack,
  actions,
  idCliente = '',
  client = ''
}) => {
  const handleLogout = () => {
    localStorage.clear()
    window.location.href = getAppBasePath()
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="d-flex align-items-center gap-3">
          {showBack && (
            <button
              className="btn btn-link text-decoration-none p-0 d-flex align-items-center"
              onClick={onBack}
              style={{ color: '#292929', fontFamily: 'Outfit', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              <i className="bi bi-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>
              Volver a Referencias
            </button>
          )}
          <div className="header-title-container">
            <h1 className="header-title">{title}</h1>
            <span className="header-subtitle">{subtitle}</span>
            {(idCliente || client) && (
              <span className="header-client-info text-muted" style={{ display: 'block', fontSize: '0.9rem', marginTop: '2px' }}>
                Cliente: {idCliente && <span className="me-1">[{idCliente}]</span>}{client || '-'}
              </span>
            )}
          </div>
        </div>

        <div className="header-actions d-flex align-items-center gap-3">
          {actions ? actions : (
            <div className="status-chip">
              <span className="status-count">{pendingCount}</span>
              <span className="status-label">Pendientes</span>
            </div>
          )}
          
          <button
            className="btn btn-link text-muted p-1"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ 
              cursor: 'pointer',
              opacity: 0.6,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = 0.6}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

