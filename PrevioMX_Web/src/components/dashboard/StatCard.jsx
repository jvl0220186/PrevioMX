import React from 'react'
import PropTypes from 'prop-types'

const StatCard = ({ label, count, variant = 'oc-primary-card', border = false }) => {
  const cardClass = `card ${variant} h-100 ${border ? 'border-dark' : ''}`
  
  return (
    <div className={cardClass} style={border ? { border: '1px solid #292929 !important' } : {}}>
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
  border: PropTypes.bool
}

export default StatCard
