import React from 'react'
import ReactDOM from 'react-dom/client'
import NewApp from './NewApp'
import DemoScene from './DemoScene'
import './index.css'

// Simple routing based on URL path
const path = window.location.pathname
const App = path === '/demo' ? DemoScene : NewApp

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)