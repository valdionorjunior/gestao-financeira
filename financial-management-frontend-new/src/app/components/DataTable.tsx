import { FC, useState, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => ReactNode
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  onEdit?: (item: T) => void
  onDelete?: (id: string) => void
  loading?: boolean
  pageSize?: number
  title?: string
}

export const DataTable: FC<DataTableProps<any>> = ({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  pageSize = 10,
  title,
}) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(data.length / pageSize)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const paginatedData = data.slice(startIdx, endIdx)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <div className="h-64 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-6 py-4 text-sm text-gray-900 dark:text-gray-100',
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key])}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir?')) {
                              onDelete(item.id)
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium ml-2"
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Página {currentPage} de {totalPages} ({data.length} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
