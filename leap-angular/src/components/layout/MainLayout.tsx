import { useState, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout, Spin } from 'antd'
import Sidebar from './Sidebar'
import Header from './Header'
import './MainLayout.scss'

const { Content } = Layout

// Loading fallback that only covers the content area, not the whole page
const ContentLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    backgroundColor: '#F5F5F5',
  }}>
    <Spin size="large" />
  </div>
)

function MainLayout() {
  const [sidebarOpened, setSidebarOpened] = useState(true)

  const handleSidebarToggle = () => {
    setSidebarOpened(!sidebarOpened)
  }

  return (
    <Layout className="main-layout">
      <Sidebar sidebarOpened={sidebarOpened} onToggle={handleSidebarToggle} />
      <Layout className="content-area">
        <Header />
        <Content className="main-content-wrapper">
          <Suspense fallback={<ContentLoadingFallback />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
