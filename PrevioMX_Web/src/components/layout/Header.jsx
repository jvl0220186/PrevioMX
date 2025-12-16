
import './Header.css'

const Header = ({
  pendingCount = 0,
  title = "Sistema de Captura de Previos",
  subtitle = "Previos MX",
  showBack = false,
  onBack,
  actions
}) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="d-flex align-items-center gap-3">
          {showBack && (
            <button
              className="btn btn-link text-decoration-none p-0 d-flex align-items-center"
              onClick={onBack}
              style={{ color: '#292929', fontFamily: 'Outfit', fontSize: '14px', fontWeight: 500 }}
            >
              <i className="bi bi-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>
              Volver a Referencias
            </button>
          )}
          <div className="header-title-container">
            <h1 className="header-title">{title}</h1>
            <span className="header-subtitle">{subtitle}</span>
          </div>
        </div>

        <div className="header-actions">
          {actions ? actions : (
            <div className="status-chip">
              <span className="status-count">{pendingCount}</span>
              <span className="status-label">Pendientes</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

