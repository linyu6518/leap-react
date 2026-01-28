import { Layout } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import NavigationTree from './NavigationTree'
import './Sidebar.scss'

const { Sider } = Layout

interface SidebarProps {
  sidebarOpened: boolean
  onToggle: () => void
}

function Sidebar({ sidebarOpened, onToggle }: SidebarProps) {
  return (
    <Sider
      width={270}
      collapsed={!sidebarOpened}
      collapsedWidth={80}
      className="sidebar"
      theme="dark"
    >
      <div className="sidebar-header" data-collapsed={!sidebarOpened}>
        <img src="/assets/td-logo.svg" alt="TD Logo" className="td-logo-img" />
        {sidebarOpened && (
          <div className="sidebar-title-section">
            <h1 className="sidebar-title">
              LEAP <span className="version-text">1.0</span>
            </h1>
            <p className="sidebar-subtitle">Liquidity Explain & Analytics</p>
          </div>
        )}
      </div>

      <div className="navigation-tree-wrapper">
        <NavigationTree sidebarOpened={sidebarOpened} />
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={sidebarOpened ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpened ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </button>
      </div>
    </Sider>
  )
}

export default Sidebar
