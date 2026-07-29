import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Sin StrictMode a propósito: el doble render de dev consumiría el RNG dos veces
// y la carrera dejaría de ser reproducible por semilla.
createRoot(document.getElementById('root')).render(<App />)
