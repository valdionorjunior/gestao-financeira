import { FC, useEffect, useState } from 'react'
import { apiClient } from '../services/api'
import { Category } from '../types'

interface CategoryFormData {
  name: string
  color: string
}

interface SubcategoryFormData {
  name: string
}

export const CategoriesPage: FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: '', color: '#635BFF' })

  // Subcategory Modal
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryFormData>({ name: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  // ─── Category Handlers ───────────────────

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({ name: category.name, color: category.color })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', color: '#635BFF' })
    }
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) {
      alert('Nome da categoria é obrigatório')
      return
    }

    try {
      setSaving(true)
      if (editingCategory?.id) {
        await apiClient.updateCategory(editingCategory.id, categoryForm)
      } else {
        await apiClient.createCategory({
          ...categoryForm,
          type: 'EXPENSE', // Default
        })
      }
      setShowCategoryModal(false)
      await loadCategories()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      setSaving(true)
      await apiClient.deleteCategory(categoryId)
      await loadCategories()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria')
    } finally {
      setSaving(false)
    }
  }

  // ─── Subcategory Handlers ───────────────────

  const openSubcategoryModal = (categoryId: string) => {
    setActiveCategoryId(categoryId)
    setSubcategoryForm({ name: '' })
    setShowSubcategoryModal(true)
  }

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategoryForm.name.trim() || !activeCategoryId) {
      alert('Nome da subcategoria é obrigatório')
      return
    }

    try {
      setSaving(true)
      await apiClient.createSubcategory(activeCategoryId, subcategoryForm)
      setShowSubcategoryModal(false)
      await loadCategories()
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error)
      alert('Erro ao salvar subcategoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return

    try {
      setSaving(true)
      await apiClient.deleteSubcategory(categoryId, subcategoryId)
      await loadCategories()
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error)
      alert('Erro ao excluir subcategoria')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorias</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Organize suas transações em categorias</p>
        </div>
        <button
          onClick={() => openCategoryModal()}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          + Adicionar Categoria
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria cadastrada</p>
        </div>
      )}

      {/* Categories List */}
      {!loading && categories.length > 0 && (
        <div className="space-y-3">
          {categories.map(category => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {category.subcategories.length} subcategorias
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      openSubcategoryModal(category.id)
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Adicionar subcategoria"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      openCategoryModal(category)
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Editar categoria"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id)
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Excluir categoria"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === category.id ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </button>

              {/* Subcategories Content */}
              {expandedId === category.id && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  {!category.subcategories || category.subcategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nenhuma subcategoria</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map(subcategory => (
                        <div
                          key={subcategory.id}
                          className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">{subcategory.name}</span>
                          <button
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            className="ml-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Excluir subcategoria"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCategoryModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ex: Alimentação"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{categoryForm.color}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSubcategoryModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Subcategoria</h2>
              <button
                onClick={() => setShowSubcategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={e => setSubcategoryForm({ name: e.target.value })}
                  placeholder="Ex: Restaurante"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubcategoryModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
