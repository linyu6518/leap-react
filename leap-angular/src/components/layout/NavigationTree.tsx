import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppstoreOutlined,
  FolderOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  ControlOutlined,
} from '@ant-design/icons'
import './NavigationTree.scss'

interface NavItem {
  label: string
  icon?: React.ReactNode
  route?: string
  children?: NavItem[]
  expanded?: boolean
}

interface NavigationTreeProps {
  sidebarOpened: boolean
}

function NavigationTree({ sidebarOpened }: NavigationTreeProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const [navItems, setNavItems] = useState<NavItem[]>([
    {
      label: 'Dashboard',
      icon: <AppstoreOutlined />,
      route: '/dashboard',
    },
    {
      label: 'Products',
      icon: <FolderOutlined />,
      route: '/product', // Navigate to Products config page
      expanded: false,
      children: [
        {
          label: 'Deposit',
          route: '/product/deposits',
        },
        {
          label: 'Commitments',
          route: '/product/commitments',
        },
        {
          label: 'Loans',
          route: '/product/loans',
        },
        {
          label: 'Derivatives',
          route: '/product/derivatives',
        },
        {
          label: 'Unsecured',
          route: '/product/unsecured',
        },
        {
          label: 'Interaffiliate Funding',
          route: '/product/interaffiliate-funding',
        },
        {
          label: 'Secured Funding',
          route: '/product/secured-funding',
        },
        {
          label: 'Other Risks',
          route: '/product/other-risks',
        },
        {
          label: 'Prime Services',
          route: '/product/prime-services',
        },
        {
          label: 'HQLA',
          route: '/product/hqla',
        },
      ],
    },
    {
      label: 'Regulatory',
      icon: <FileTextOutlined />,
      route: '/regulatory/lcr', // Navigate to LCR config page
      expanded: false,
      children: [
        {
          label: 'Metrics',
          expanded: false,
          children: [
            {
              label: 'LCR',
              route: '/regulatory/lcr',
            },
            {
              label: 'NSFR',
              route: '/regulatory/nsfr',
            },
            {
              label: 'NCCF',
              route: '/regulatory/nccf',
            },
          ],
        },
        {
          label: 'Reporting',
          expanded: false,
          children: [
            {
              label: 'FR2052a',
              route: '/reports/fr2052a',
            },
            {
              label: 'STWF',
              route: '/reports/stwf',
            },
            {
              label: 'Appendix VI',
              route: '/reports/appendix-vi',
            },
            {
              label: 'OSFI LCR',
              route: '/reports/osfi-lcr',
            },
          ],
        },
        {
          label: 'Templates',
          expanded: false,
          children: [
            {
              label: 'Data Import',
              route: '/templates/import',
            },
            {
              label: 'Product Mapping',
              route: '/templates/mapping',
            },
            {
              label: 'Threshold Settings',
              route: '/templates/thresholds',
            },
          ],
        },
        {
          label: 'Others',
          expanded: false,
          children: [],
        },
      ],
    },
    {
      label: 'Workspace',
      icon: <UsergroupAddOutlined />,
      expanded: false,
      children: [
        {
          label: 'Maker Review',
          route: '/maker/review',
        },
        {
          label: 'Checker Approve',
          route: '/checker/approve',
        },
      ],
    },
    {
      label: 'Admin',
      icon: <ControlOutlined />,
      expanded: false,
      children: [
        {
          label: 'User Management',
          route: '/admin/users',
        },
        {
          label: 'System Settings',
          route: '/admin/settings',
        },
        {
          label: 'Audit Log',
          route: '/admin/audit-log',
        },
      ],
    },
  ])

  const isActive = (route?: string): boolean => {
    if (!route) return false
    // Exact match or route is a prefix of current pathname (for nested routes)
    return location.pathname === route || location.pathname.startsWith(route + '/')
  }

  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) return false
    return item.children.some((child) => {
      if (child.route && isActive(child.route)) return true
      if (child.children) {
        return child.children.some((subChild) => subChild.route && isActive(subChild.route))
      }
      return false
    })
  }

  const toggleExpand = (index: number) => {
    setNavItems((prev) => {
      // Create a deep clone of the item to ensure React detects the change
      const newItems = prev.map((navItem, idx) => {
        if (idx === index) {
          return {
            ...navItem,
            expanded: !navItem.expanded
          }
        }
        return navItem
      })
      return newItems
    })
  }

  const toggleChildExpand = (parentIndex: number, childIndex: number) => {
    setNavItems((prev) => {
      // Create a deep clone to ensure React detects the change
      const newItems = prev.map((navItem, idx) => {
        if (idx === parentIndex && navItem.children) {
          return {
            ...navItem,
            children: navItem.children.map((child, childIdx) => {
              if (childIdx === childIndex) {
                return {
                  ...child,
                  expanded: !child.expanded
                }
              }
              return child
            })
          }
        }
        return navItem
      })
      return newItems
    })
  }

  const handleNavigate = (item: NavItem, parentIndex?: number, childIndex?: number, e?: React.MouseEvent) => {
    // Prevent default to avoid page refresh
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Always allow expand/collapse for items with children
    if (item.children && item.children.length > 0) {
      if (parentIndex !== undefined && childIndex !== undefined) {
        // Level 2 with children: toggle child expand
        toggleChildExpand(parentIndex, childIndex)
        // Navigate if route exists and not already on that route
        if (item.route && location.pathname !== item.route) {
          navigate(item.route, { replace: true })
        }
      } else if (parentIndex !== undefined) {
        // Level 1: toggle expand (smooth animation) and navigate if route exists
        toggleExpand(parentIndex)
        // Navigate if route exists and not already on that route
        if (item.route && location.pathname !== item.route) {
          navigate(item.route, { replace: true })
        }
      }
    } else if (item.route) {
      // No children: navigate directly only if not already on that route
      if (location.pathname !== item.route) {
        navigate(item.route, { replace: true })
      }
    }
  }

  return (
    <div className={`navigation-tree ${!sidebarOpened ? 'sidebar-collapsed' : ''}`}>
      {navItems.map((item, index) => (
        <div key={index}>
          <div
            className={`nav-item level-1 ${isActive(item.route) ? 'active' : ''} ${hasActiveChild(item) ? 'has-active-child' : ''} ${item.children ? 'has-children' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleNavigate(item, index, undefined, e)
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="nav-item-content">
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              {sidebarOpened && <span className="nav-label">{item.label}</span>}
              {item.children && sidebarOpened && (
                <span className={`expand-icon ${item.expanded ? 'expanded' : ''}`}></span>
              )}
            </div>
          </div>

          {/* Level 2 Children */}
          {item.children && item.expanded && sidebarOpened && (
            <div className="nav-children">
              {item.children.map((child, childIndex) => (
                <div key={childIndex}>
                  <div
                    className={`nav-item level-2 ${isActive(child.route) ? 'active' : ''} ${child.children ? 'has-children' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNavigate(child, index, childIndex, e)
                    }}
                  >
                    <div className="nav-item-content">
                      <span className="nav-dot"></span>
                      <span className="nav-label">{child.label}</span>
                      {child.children && (
                        <span className={`expand-icon ${child.expanded ? 'expanded' : ''}`}></span>
                      )}
                    </div>
                  </div>

                  {/* Level 3 Children */}
                  {child.children && child.expanded && (
                    <div className="nav-children">
                      {child.children.map((subChild, subChildIndex) => (
                        <div
                          key={subChildIndex}
                          className={`nav-item level-3 ${isActive(subChild.route) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (subChild.route && location.pathname !== subChild.route) {
                              navigate(subChild.route, { replace: true })
                            }
                          }}
                        >
                          <div className="nav-item-content">
                            <span className="nav-dot"></span>
                            <span className="nav-label">{subChild.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default NavigationTree
