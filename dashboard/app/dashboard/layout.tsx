'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiBox, 
  FiShoppingCart, 
  FiBarChart3, 
  FiSettings, 
  FiLogOut, 
  FiPackage,
  FiUsers
} from 'react-icons/fi'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Products', href: '/dashboard/products', icon: FiBox },
  { name: 'Product Items', href: '/dashboard/items', icon: FiPackage },
  { name: 'Orders', href: '/dashboard/orders', icon: FiShoppingCart },
  { name: 'Users', href: '/dashboard/users', icon: FiUsers },
  { name: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: FiSettings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gray-900 text-white transition-all duration-300 flex flex-col fixed h-screen z-20 left-0 top-0`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen && <span className="text-xl font-bold">PBS Admin</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon className="flex-shrink-0 text-lg" />
                {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-800 p-4 space-y-2">
          {sidebarOpen && (
            <div className="text-xs mb-3">
              <p className="text-gray-400">Logged as</p>
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition"
          >
            <FiLogOut />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${
        sidebarOpen ? 'ml-64' : 'ml-20'
      } flex-1 overflow-auto transition-all duration-300`}>
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8">
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find(item => item.href === pathname || pathname.startsWith(item.href + '/'))?.name || 'Dashboard'}
          </h1>
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
