import React, { useState } from 'react'
import PropTypes from 'prop-types'

const StatCard = ({ label, count, variant = 'oc-primary-card', border = false, active = false, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const cardClass = `card ${variant} h-100 ${border ? 'border-dark' : ''} ${active ? 'stat-card-active' : ''}`
  const isClickable = !!onClick
  
  const cardStyle = {
    ...(border ? { border: '1px solid #292929' } : {}),
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    ...(isClickable && isHovered && !active ? {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    } : {}),
    ...(active ? { 
      boxShadow: '0 0 0 3px #0d6efd', 
      transform: 'scale(1.02)',
      backgroundColor: '#e7f1ff'
    } : {})
  }
  
  return (
    <div 
      className={cardClass} 
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
          {label}
        </h6>
        <h2 className="card-title display-5 fw-bold mb-0">
          {count}
        </h2>
      </div>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variant: PropTypes.string,
  border: PropTypes.bool,
  active: PropTypes.bool,
  onClick: PropTypes.func
}

export default StatCard
