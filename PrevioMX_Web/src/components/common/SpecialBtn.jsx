import React from 'react';
import '../../styles/oc-components.css';

const SpecialBtn = ({
    label,
    iconLeft,
    iconRight,
    onClick,
    disabled = false,
    type = 'button',
    className = '',
    style = {},
    ...props
}) => {
    return (
        <button
            type={type}
            className={`btn oc-special-btn ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
            {...props}
        >
            {iconLeft && <span className="oc-btn-icon left">{iconLeft}</span>}
            <span className="oc-btn-text">{label || props.children}</span>
            {iconRight && <span className="oc-btn-icon right">{iconRight}</span>}
        </button>
    );
};

export default SpecialBtn;
