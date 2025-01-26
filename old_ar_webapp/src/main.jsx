import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DetailsAR from './DetailsAR'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <DetailsAR/> */}
  </StrictMode>,
)
