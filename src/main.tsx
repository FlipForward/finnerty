import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/app.css'
import './studio/styles/studio.css'
import './studio/styles/loading.css'
import './studio/styles/os.css'
import './studio/styles/camera.css'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
