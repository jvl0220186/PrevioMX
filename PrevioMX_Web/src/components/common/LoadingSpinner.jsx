import './LoadingSpinner.css'

const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  return (
    <div className={`loading-spinner-container ${size} ${color}`}>
      <div className="lds-roller">
        <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
      </div>
    </div>
  )
}

export default LoadingSpinner

