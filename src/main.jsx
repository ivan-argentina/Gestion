import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
const theme = createTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
       <BrowserRouter>
          <App />
       </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
