import { NavLink } from 'react-router-dom'
import {
  Image as ImageIcon,
  FolderOpen,
  Users,
  Tag as TagIcon,
  Upload,
  ChevronsLeft,
  ChevronsRight,
  Camera,
} from 'lucide-react'
import { useUIStore } from '@/store'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const navItems = [
    { to: '/', icon: ImageIcon, label: '照片库' },
    { to: '/albums', icon: FolderOpen, label: '相册' },
    { to: '/people', icon: Users, label: '人物' },
    { to: '/tags', icon: TagIcon, label: '标签' },
    { to: '/import', icon: Upload, label: '导入照片' },
  ]

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Camera size={20} strokeWidth={2.5} />
        </div>
        <span className={styles.title}>PhotoVault</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>
              <item.icon size={20} />
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.collapseBtn} onClick={toggleSidebar}>
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span>收起侧栏</span>}
        </button>
      </div>
    </aside>
  )
}
