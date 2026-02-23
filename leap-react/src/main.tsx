import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import { store } from './store'
import App from './App'
import './styles/global.css'
import './styles/form-components.scss'
import { theme } from './styles/theme'

// Configure dayjs
dayjs.locale('en')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
)
