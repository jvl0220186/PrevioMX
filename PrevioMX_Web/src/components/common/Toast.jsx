import React, { useEffect } from 'react'

const Toast = ({ message, type = 'warning', show, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [show, duration, onClose])

    if (!show) return null

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return 'bi-exclamation-triangle-fill'
            case 'success':
                return 'bi-check-circle-fill'
            case 'error':
                return 'bi-x-circle-fill'
            case 'info':
                return 'bi-info-circle-fill'
            default:
                return 'bi-exclamation-triangle-fill'
        }
    }

    const getColors = () => {
        switch (type) {
            case 'warning':
                return { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '#856404' }
            case 'success':
                return { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '#155724' }
            case 'error':
                return { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '#721c24' }
            case 'info':
                return { bg: '#cce5ff', border: '#007bff', text: '#004085', icon: '#004085' }
            default:
                return { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '#856404' }
        }
    }

    const colors = getColors()

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                minWidth: '300px',
                maxWidth: '450px',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'slideIn 0.3s ease-out'
            }}
        >
            <i 
                className={`bi ${getIcon()}`} 
                style={{ color: colors.icon, fontSize: '20px', flexShrink: 0 }}
            ></i>
            <div style={{ flex: 1, color: colors.text, fontSize: '14px' }}>
                {message}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text,
                    cursor: 'pointer',
                    padding: '0',
                    fontSize: '18px',
                    lineHeight: 1
                }}
            >
                <i className="bi bi-x"></i>
            </button>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    )
}

export default Toast

