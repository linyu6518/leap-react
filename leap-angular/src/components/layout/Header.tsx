import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Badge, Dropdown, MenuProps, Avatar } from 'antd'
import { SearchOutlined, BellOutlined, SwapOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { logoutAsync } from '@store/slices/authSlice'
import { TDInput } from '@components/shared'
import './Header.scss'

const { Header: AntHeader } = Layout

type ViewMode = 'maker' | 'checker'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [searchValue, setSearchValue] = useState('')

  // Determine current view mode from route
  const getCurrentViewMode = (): ViewMode => {
    if (location.pathname.includes('/checker')) {
      return 'checker'
    }
    return 'maker'
  }

  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(getCurrentViewMode())
  const [currentUser, setCurrentUser] = useState({
    name: 'Yu Lin',
    role: 'Maker',
    avatar: 'YL',
  })

  useEffect(() => {
    setCurrentViewMode(getCurrentViewMode())
  }, [location.pathname])

  useEffect(() => {
    if (user) {
      setCurrentUser({
        name: user.fullName || user.username,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        avatar: getInitials(user.fullName || user.username),
      })
    }
  }, [user])

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleLogout = () => {
    dispatch(logoutAsync())
    navigate('/login')
  }

  const switchToMaker = () => {
    setCurrentViewMode('maker')
    navigate('/maker/review')
  }

  const switchToChecker = () => {
    setCurrentViewMode('checker')
    navigate('/checker/approve')
  }

  const menuItems: MenuProps['items'] = [
    ...(currentViewMode === 'maker' ? [
      {
        key: 'switch-to-checker',
        icon: <SwapOutlined />,
        label: 'Switch to Checker View',
        onClick: switchToChecker,
      },
    ] : [
      {
        key: 'switch-to-maker',
        icon: <SwapOutlined />,
        label: 'Switch to Maker View',
        onClick: switchToMaker,
      },
    ]),
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader className="app-header">
      <div className="header-left">
        <div className="search-box">
          <TDInput
            className="search-input"
            placeholder="Search"
            label=" " // Space to disable floating label, will be hidden
            value={searchValue}
            onChange={(e) => setSearchValue(e.currentTarget.value)}
            leading={{
              content: <SearchOutlined className="search-icon" />,
              type: 'icon'
            }}
            clearBtn={{
              a11yDesc: 'Clear search',
              onClick: () => setSearchValue('')
            }}
          />
        </div>
      </div>

      <div className="header-right">
        <Badge count={3} size="small">
          <button className="notification-button">
            <BellOutlined />
          </button>
        </Badge>

        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          overlayClassName="user-dropdown-menu"
        >
          <button className="user-menu-button">
            <Avatar className="user-avatar">{currentUser.avatar}</Avatar>
          </button>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header
