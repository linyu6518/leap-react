import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './Sidebar'
import Header from './Header'
import './MainLayout.scss'

const { Content } = Layout

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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
