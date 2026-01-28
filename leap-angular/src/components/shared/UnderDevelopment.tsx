import './UnderDevelopment.scss'

function UnderDevelopment() {
  return (
    <div className="under-development-container">
      <div className="under-development-content">
        <svg
          className="under-development-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tool icon with super thin lines */}
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="under-development-title">Under Development</h2>
        <p className="under-development-message">
          This feature is currently under development. Please check back later.
        </p>
      </div>
    </div>
  )
}

export default UnderDevelopment
