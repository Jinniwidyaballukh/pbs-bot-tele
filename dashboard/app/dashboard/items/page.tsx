'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { FiPlus, FiTrash2, FiSearch, FiX, FiCopy, FiCheck, FiDownload, FiCheckSquare, FiSquare, FiArrowDown } from 'react-icons/fi'
import type { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']
type ProductItem = Database['public']['Tables']['product_items']['Row']

type SortOption = 'recent' | 'oldest' | 'available' | 'sold' | 'reserved'

export default function ProductItemsPage() {
  const supabase = createBrowserClient()
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ProductItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [newItems, setNewItems] = useState('')
  const [batchName, setBatchName] = useState('')
  const [itemNotes, setItemNotes] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchItems(selectedProduct)
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('nama')
        .returns<Product[]>()

      if (fetchError) throw fetchError
      setProducts(data || [])
      if (data && data.length > 0) {
        setSelectedProduct(data[0].kode)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async (productCode: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('product_items')
        .select('*')
        .eq('product_code', productCode)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return

    const availableItemsSelected = Array.from(selectedItems).filter(id => {
      const item = items.find(i => i.id === id)
      return item?.status === 'available'
    })

    if (availableItemsSelected.length === 0) {
      alert('Only available items can be deleted. Selected items are not available.')
      return
    }

    if (!confirm(`Are you sure you want to delete ${availableItemsSelected.length} available item(s)?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('product_items')
        .delete()
        .in('id', availableItemsSelected)

      if (error) throw error

      alert(`Successfully deleted ${availableItemsSelected.length} item(s)`)
      setSelectedItems(new Set())
      fetchItems(selectedProduct)
    } catch (error) {
      console.error('Error batch deleting:', error)
      alert('Error deleting items')
    }
  }

  const exportToCSV = () => {
    const itemsToExport = items.filter(i => selectedItems.size === 0 || selectedItems.has(i.id))
    if (itemsToExport.length === 0) {
      alert('No items to export')
      return
    }

    const headers = ['Product Code', 'Item Data', 'Status', 'Batch', 'Notes', 'Created At']
    const rows = itemsToExport.map(i => [
      i.product_code,
      i.item_data,
      i.status,
      i.batch || '',
      i.notes || '',
      new Date(i.created_at).toLocaleString('id-ID')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    downloadFile(csvContent, `items_${selectedProduct}.csv`, 'text/csv')
  }

  const exportToTXT = () => {
    const itemsToExport = items.filter(i => selectedItems.size === 0 || selectedItems.has(i.id))
    if (itemsToExport.length === 0) {
      alert('No items to export')
      return
    }

    // Simple format: one item per line
    const txtContent = itemsToExport.map(i => i.item_data).join('\n')
    downloadFile(txtContent, `items_${selectedProduct}.txt`, 'text/plain')
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleAddItems = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct || !newItems.trim()) {
      alert('Please select a product and enter items')
      return
    }

    try {
      const product = products.find(p => p.kode === selectedProduct)
      if (!product) throw new Error('Product not found')

      const itemLines = newItems
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      const itemsToInsert = itemLines.map(itemData => ({
        product_id: product.id,
        product_code: product.kode,
        item_data: itemData,
        status: 'available' as const,
        batch: batchName.trim() || null,
        notes: itemNotes.trim() || null,
      }))

      const { error: insertError } = await supabase
        .from('product_items')
        .insert(itemsToInsert as any)

      if (insertError) throw insertError

      setNewItems('')
      setBatchName('')
      setItemNotes('')
      setShowAddModal(false)
      await fetchItems(selectedProduct)
      alert(`Successfully added ${itemLines.length} items!`)
      
      // Trigger bot refresh
      try {
        await fetch('/api/bot/refresh', { method: 'POST' })
        console.log('✅ Bot refreshed after adding items')
      } catch (refreshErr) {
        console.warn('⚠️ Failed to trigger bot refresh:', refreshErr)
      }
    } catch (error: any) {
      console.error('Error adding items:', error)
      alert('Failed to add items: ' + error.message)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error: deleteError } = await supabase
        .from('product_items')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setItems(items.filter(i => i.id !== id))
    } catch (error: any) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const handleCopyItem = (itemData: string, id: string) => {
    navigator.clipboard.writeText(itemData)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredItems = items.filter(
    item =>
      item.item_data.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'available':
        // Available first, then others
        if (a.status === 'available' && b.status !== 'available') return -1
        if (a.status !== 'available' && b.status === 'available') return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'sold':
        // Sold first, then others
        if (a.status === 'sold' && b.status !== 'sold') return -1
        if (a.status !== 'sold' && b.status === 'sold') return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'reserved':
        // Reserved first, then others
        if (a.status === 'reserved' && b.status !== 'reserved') return -1
        if (a.status !== 'reserved' && b.status === 'reserved') return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  const selectedProductData = products.find(p => p.kode === selectedProduct)
  const availableCount = items.filter(i => i.status === 'available').length
  const reservedCount = items.filter(i => i.status === 'reserved').length
  const soldCount = items.filter(i => i.status === 'sold').length

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Product Items</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm md:text-base"
          >
            <FiPlus /> <span className="whitespace-nowrap">Upload Batch</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition text-sm md:text-base"
          >
            <FiPlus /> <span className="whitespace-nowrap">Add Items</span>
          </button>
        </div>
      </div>

      {/* Product Selector */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Select Product</label>
        <select
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value)
            setSelectedItems(new Set())
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
        >
          {products.map(product => (
            <option key={product.id} value={product.kode}>
              {product.nama} ({product.kode})
            </option>
          ))}
        </select>
      </div>

      {/* Batch Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 md:p-6 space-y-3">
          <p className="text-indigo-900 font-semibold text-sm md:text-base">
            ✓ {selectedItems.size} item(s) selected
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedItems(new Set())}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium border border-gray-300"
            >
              <FiX size={16} /> Clear
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <FiDownload size={16} /> Export CSV
            </button>
            <button
              onClick={exportToTXT}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <FiDownload size={16} /> Export TXT
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <FiTrash2 size={16} /> Delete Available
            </button>
          </div>
        </div>
      )}

      {/* Export All Options & Search/Sort */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
          {/* Export Options */}
          {selectedItems.size === 0 && (
            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Export All Items</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg transition text-sm font-medium"
                >
                  <FiDownload /> Export All to CSV
                </button>
                <button
                  onClick={exportToTXT}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg transition text-sm font-medium"
                >
                  <FiDownload /> Export All to TXT
                </button>
              </div>
            </div>
          )}

          {/* Search & Sort */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Search & Filter</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Search Items</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search items or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Sort Dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FiArrowDown size={14} /> Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="recent">Recent (Newest First)</option>
                  <option value="oldest">Oldest (Oldest First)</option>
                  <option value="available">Available Items First</option>
                  <option value="sold">Sold Items First</option>
                  <option value="reserved">Reserved Items First</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {items.length === 0
              ? 'No items for this product. Add your first item!'
              : 'No items match your search'}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 rounded transition"
                        title={selectedItems.size === sortedItems.length ? 'Deselect All' : 'Select All'}
                      >
                        {selectedItems.size === sortedItems.length ? (
                          <FiCheckSquare className="text-indigo-600" size={18} />
                        ) : (
                          <FiSquare className="text-gray-400" size={18} />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Item Data</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Notes</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Batch</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition ${
                      selectedItems.has(item.id) ? 'bg-indigo-50' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectItem(item.id)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                        >
                          {selectedItems.has(item.id) ? (
                            <FiCheckSquare className="text-indigo-600" size={18} />
                          ) : (
                            <FiSquare className="text-gray-400" size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-between group">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono max-w-xs truncate">
                            {item.item_data}
                          </code>
                          <button
                            onClick={() => handleCopyItem(item.item_data, item.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
                            title="Copy"
                          >
                            {copiedId === item.id ? <FiCheck /> : <FiCopy />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'reserved'
                            ? 'bg-yellow-100 text-yellow-800'
                            : item.status === 'sold'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {item.notes || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {item.batch || '-'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {item.status === 'available' && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {sortedItems.map((item) => (
                <div key={item.id} className={`p-4 hover:bg-gray-50 ${
                  selectedItems.has(item.id) ? 'bg-indigo-50' : ''
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleSelectItem(item.id)}
                        className="mt-1 p-1 hover:bg-gray-200 rounded transition"
                      >
                        {selectedItems.has(item.id) ? (
                          <FiCheckSquare className="text-indigo-600" size={18} />
                        ) : (
                          <FiSquare className="text-gray-400" size={18} />
                        )}
                      </button>
                      <div className="flex-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono break-all">
                          {item.item_data}
                        </code>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleCopyItem(item.item_data, item.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition"
                        title="Copy"
                      >
                        {copiedId === item.id ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      </button>
                      {item.status === 'available' && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-gray-500 text-xs">Status:</span>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'reserved'
                            ? 'bg-yellow-100 text-yellow-800'
                            : item.status === 'sold'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    {(item.notes || item.batch) && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {item.notes && (
                          <div>
                            <span className="text-gray-500 text-xs">Notes:</span>
                            <p className="text-gray-700 text-xs">{item.notes}</p>
                          </div>
                        )}
                        {item.batch && (
                          <div>
                            <span className="text-gray-500 text-xs">Batch:</span>
                            <p className="text-gray-700 text-xs">{item.batch}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Items Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Items</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Product: <span className="font-medium text-indigo-600">{selectedProductData?.nama}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewItems('')
                  setBatchName('')
                  setItemNotes('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddItems} className="p-6 space-y-6">
              {/* Items Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Items Data <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600">
                  Enter one item per line. Supported formats:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 mb-2">
                  <li>• Email & Password: <code className="bg-gray-100 px-1 rounded">email@example.com:password123</code></li>
                  <li>• Voucher Code: <code className="bg-gray-100 px-1 rounded">VOUCHER-ABC-123</code></li>
                  <li>• Account Info: <code className="bg-gray-100 px-1 rounded">username||password||extra_info</code></li>
                </ul>
                <textarea
                  value={newItems}
                  onChange={(e) => setNewItems(e.target.value)}
                  placeholder="user1@gmail.com:pass123&#10;user2@gmail.com:pass456&#10;VOUCHER-XYZ-789"
                  rows={10}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
                {newItems.trim() && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                      {newItems.split('\n').filter(line => line.trim()).length} items ready
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Batch Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-600">
                  Group items by batch for easier management (e.g., "JAN-2026", "Promo-Week1")
                </p>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., JAN-2026 or PROMO-BATCH-1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notes / After Message */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Notes / After-Purchase Message <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-600">
                  Add notes for internal use or message to be sent to customer after purchase
                </p>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="e.g., Login via app only. Password can be changed after first login."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="text-blue-500 text-xl">💡</div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 text-sm mb-1">Tips:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Paste multiple items at once - each line becomes one item</li>
                      <li>• Use batch names to organize seasonal or promotional items</li>
                      <li>• Notes will be stored with items for future reference</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewItems('')
                    setBatchName('')
                    setItemNotes('')
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newItems.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition shadow-sm"
                >
                  {newItems.trim() 
                    ? `Add ${newItems.split('\n').filter(line => line.trim()).length} Items`
                    : 'Add Items'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload Product Items (CSV/TXT)</h2>
              <button
                onClick={() => { setShowUploadModal(false); setUploadError(null); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-700">Format columns (with header):</p>
              <pre className="bg-gray-100 p-3 rounded text-xs text-gray-800 overflow-auto">product_code,item_data,status,notes,batch\nPAKET-30H,email1@test.com:pass123,available,,JAN-2026\nPAKET-30H,VCHR-ABC-123,available,Promo batch,JAN-2026</pre>
              <p className="text-xs text-gray-600">If <strong>product_code</strong> is omitted, the currently selected product will be used.</p>
              <input
                type="file"
                accept=".csv,.txt"
                className="block w-full text-sm text-gray-700"
                onChange={async (e) => {
                  setUploadError(null)
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
                    if (lines.length < 2) throw new Error('No data rows')
                    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
                    const idx = (name: string) => header.indexOf(name)
                    const hasProductCode = idx('product_code') !== -1
                    if (!hasProductCode && !selectedProduct) throw new Error('Select a product or include product_code')
                    const rows = lines.slice(1).map((line) => line.split(',').map(c => c.trim()))
                    const inserts = rows.map(cols => ({
                      product_code: hasProductCode ? (cols[idx('product_code')] || selectedProduct) : selectedProduct,
                      item_data: idx('item_data') !== -1 ? (cols[idx('item_data')] || '') : '',
                      status: (idx('status') !== -1 ? (cols[idx('status')] || 'available') : 'available') as 'available' | 'reserved' | 'sold' | 'error',
                      notes: idx('notes') !== -1 ? (cols[idx('notes')] || null) : null,
                      batch: idx('batch') !== -1 ? (cols[idx('batch')] || null) : null,
                    }))
                    const invalid = inserts.find(i => !i.product_code || !i.item_data)
                    if (invalid) throw new Error('Invalid row detected')
                    const { error } = await supabase.from('product_items').insert(inserts as any)
                    if (error) throw error
                    await fetchItems(selectedProduct || inserts[0].product_code)
                    setShowUploadModal(false)
                    alert(`Uploaded ${inserts.length} items successfully`)
                    
                    // Trigger bot refresh
                    try {
                      await fetch('/api/bot/refresh', { method: 'POST' })
                      console.log('✅ Bot refreshed after batch upload')
                    } catch (refreshErr) {
                      console.warn('⚠️ Failed to trigger bot refresh:', refreshErr)
                    }
                  } catch (err: any) {
                    console.error('Upload error:', err)
                    setUploadError(err.message || 'Upload failed')
                  }
                }}
              />
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{uploadError}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
