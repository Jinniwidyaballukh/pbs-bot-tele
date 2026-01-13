'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { FiSearch, FiMail, FiCalendar } from 'react-icons/fi'

interface User {
  id: string
  first_name: string
  last_name?: string
  telegram_id: string
  favorites_count?: number
  purchase_count?: number
  joined_at: string
}

export default function UsersPage() {
  const supabase = createBrowserClient()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // For now, we'll show a placeholder
      // In production, you'd query your users table
      setUsers([])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.telegram_id.includes(searchQuery)
  )

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <p className="text-blue-700 text-sm font-medium">Active Users (30d)</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <p className="text-green-700 text-sm font-medium">Total Purchases</p>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>
      </div>

      {/* Search */}
      {users.length > 0 && (
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg font-medium mb-2">No User Data Available Yet</p>
            <p className="text-gray-500 text-sm">
              Users will appear here once they start using the Telegram bot
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto border border-blue-200">
              <p className="text-blue-900 text-sm">
                <strong>Note:</strong> To track user data, make sure the bot is properly configured to store user information in Supabase.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Telegram ID</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-900">Purchases</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-900">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{user.first_name} {user.last_name || ''}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-sm text-gray-600">{user.telegram_id}</span>
                  </td>
                  <td className="px-6 py-3 text-center text-gray-600">
                    {user.purchase_count || 0}
                  </td>
                  <td className="px-6 py-3 text-center text-sm text-gray-600">
                    {new Date(user.joined_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Integration Guide */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow p-6 border border-indigo-200">
        <h3 className="text-lg font-bold text-indigo-900 mb-3">👥 User Tracking Setup</h3>
        <p className="text-indigo-800 text-sm mb-3">
          To enable user tracking in this dashboard, ensure your Telegram bot is configured to store user data in Supabase.
        </p>
        <div className="bg-white rounded p-3 text-xs text-gray-700 font-mono">
          <p className="mb-2">Table: <strong>users</strong></p>
          <p className="mb-2">Columns: id, telegram_id, first_name, last_name, created_at</p>
          <p>Once data is populated, user statistics will display automatically.</p>
        </div>
      </div>
    </div>
  )
}
