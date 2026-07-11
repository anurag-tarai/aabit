import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FontSizeProvider } from './components/common/FontSizeContext.tsx'
import { ThemeProvider } from './components/common/ThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FontSizeProvider>
            <App />
      </FontSizeProvider>
    </ThemeProvider>
  </StrictMode>,
)
