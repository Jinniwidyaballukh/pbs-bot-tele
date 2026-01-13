'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi'
import type { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

export default function ProductsPage() {
  const supabase = createBrowserClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Database['public']['Tables']['products']['Insert']>({
    kode: '',
    nama: '',
    harga: 0,
    kategori: '',
    stok: 0,
    deskripsi: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setFormData({
      kode: '',
      nama: '',
      harga: 0,
      kategori: '',
      stok: 0,
      deskripsi: '',
    })
    setShowModal(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      kode: product.kode,
      nama: product.nama,
      harga: product.harga,
      kategori: product.kategori || '',
      stok: product.stok,
      deskripsi: product.deskripsi || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProducts(products.filter(p => p.id !== id))
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingProduct) {
        // Update
        const { error: updateError } = await supabase
          .from('products')
          .update(formData as any)
          .eq('id', editingProduct.id)

        if (updateError) throw updateError
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('products')
          .insert([formData] as any)

        if (insertError) throw insertError
      }

      await fetchProducts()
      setShowModal(false)
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    }
  }

  const filteredProducts = products.filter(
    p =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No products found' : 'No products yet. Add your first product!'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Code</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Category</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Price</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Stock</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3">
                    <span className="font-mono text-sm text-gray-700">{product.kode}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{product.nama}</p>
                      {product.deskripsi && (
                        <p className="text-xs text-gray-500 mt-1">{product.deskripsi}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {product.kategori || '-'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-semibold text-gray-900">
                      Rp {product.harga.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      product.stok > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stok}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.kategori || ''}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (IDR)</label>
                <input
                  type="number"
                  value={formData.harga}
                  onChange={(e) => setFormData({ ...formData, harga: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
