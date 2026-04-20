import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0D0D1A',
          color: '#F0F0FA',
          padding: '24px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
        }}>
          <h1 style={{ fontSize: '18px', marginBottom: '12px' }}>Runtime Error</h1>
          <div>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      )
    }

    return this.props.children
  }
}

// Register service worker for PWA + background notification support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
