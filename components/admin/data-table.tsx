'use client'

import { useState } from 'react'
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CrudState, CrudActions, CrudItem } from '@/hooks/use-crud'

export interface DataTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  searchable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableAction<T> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (item: T) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  show?: (item: T) => boolean
}

export interface DataTableProps<T extends CrudItem> {
  title: string
  description?: string
  columns: DataTableColumn<T>[]
  state: CrudState<T>
  actions: CrudActions<T>
  itemActions?: DataTableAction<T>[]
  bulkActions?: DataTableAction<T[]>[]
  onCreateNew?: () => void
  onExport?: () => void
  filters?: React.ReactNode
  emptyMessage?: string
  emptyDescription?: string
}

export function DataTable<T extends CrudItem>({
  title,
  description,
  columns,
  state,
  actions,
  itemActions = [],
  bulkActions = [],
  onCreateNew,
  onExport,
  filters,
  emptyMessage = 'No items found',
  emptyDescription = 'Get started by creating your first item.'
}: DataTableProps<T>) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<T | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const handleSort = (column: string) => {
    if (state.sortBy === column) {
      actions.setSortOrder(state.sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      actions.setSortBy(column)
      actions.setSortOrder('asc')
    }
  }

  const handleDeleteItem = (item: T) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      await actions.deleteItem(itemToDelete.id)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    await actions.deleteItems(state.selectedItems)
    setBulkDeleteDialogOpen(false)
  }

  const getSortIcon = (column: string) => {
    if (state.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4" />
    }
    return state.sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />
  }

  const renderCellValue = (column: DataTableColumn<T>, item: T) => {
    const value = typeof column.key === 'string' && column.key.includes('.') 
      ? column.key.split('.').reduce((obj, key) => obj?.[key], item)
      : item[column.key as keyof T]

    if (column.render) {
      return column.render(value, item)
    }

    if (value === null || value === undefined) {
      return <span className="text-white/40">-</span>
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (value instanceof Date) {
      return <span className="text-white/80">{(value as Date).toLocaleDateString()}</span>
    }

    if (typeof value === 'string' && value.startsWith('http')) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Link
        </a>
      )
    }

    return <span className="text-white">{String(value)}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-white/70 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              onClick={onExport}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              className="bg-white text-black hover:bg-white/90"
            >
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={state.searchTerm}
                  onChange={(e) => actions.setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            
            {/* Custom Filters */}
            {filters && (
              <div className="flex items-center gap-2">
                {filters}
              </div>
            )}
            
            {/* Refresh */}
            <Button
              onClick={actions.refresh}
              variant="outline"
              size="sm"
              disabled={state.loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {state.selectedItems.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-white">
                {state.selectedItems.length} item(s) selected
              </span>
              <div className="flex items-center gap-2">
                {bulkActions.map((action, index) => {
                  const IconComponent = action.icon
                  return (
                    <Button
                      key={index}
                      onClick={() => action.onClick(state.items.filter(item => state.selectedItems.includes(item.id)))}
                      variant={action.variant || 'outline'}
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                      {action.label}
                    </Button>
                  )
                })}
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  onClick={actions.clearSelection}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardContent className="p-0">
          {state.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70">Loading...</p>
              </div>
            </div>
          ) : state.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/40 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{emptyMessage}</h3>
              <p className="text-white/60 mb-4">{emptyDescription}</p>
              {onCreateNew && (
                <Button onClick={onCreateNew} className="bg-white text-black hover:bg-white/90">
                  Create First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4">
                      <Checkbox
                        checked={state.selectedItems.length === state.items.length}
                        onCheckedChange={actions.selectAll}
                        className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                      />
                    </th>
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className={`p-4 text-white font-medium ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                        style={{ width: column.width }}
                      >
                        {column.sortable ? (
                          <Button
                            variant="ghost"
                            onClick={() => handleSort(column.key as string)}
                            className="h-auto p-0 text-white hover:text-white/80 hover:bg-transparent"
                          >
                            {column.label}
                            {getSortIcon(column.key as string)}
                          </Button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    {itemActions.length > 0 && (
                      <th className="text-right p-4 text-white font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {state.items.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={state.selectedItems.includes(item.id)}
                          onCheckedChange={() => actions.selectItem(item.id)}
                          className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                        />
                      </td>
                      {columns.map((column, colIndex) => (
                        <td 
                          key={colIndex} 
                          className={`p-4 ${
                            column.align === 'center' ? 'text-center' : 
                            column.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {renderCellValue(column, item)}
                        </td>
                      ))}
                      {itemActions.length > 0 && (
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end"
                              className="bg-black/90 border-white/20 backdrop-blur-xl"
                            >
                              <DropdownMenuLabel className="text-white">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/20" />
                              {itemActions.map((action, actionIndex) => {
                                if (action.show && !action.show(item)) return null
                                
                                const IconComponent = action.icon
                                return (
                                  <DropdownMenuItem
                                    key={actionIndex}
                                    onClick={() => action.onClick(item)}
                                    className="text-white hover:bg-white/20 cursor-pointer"
                                  >
                                    {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                                    {action.label}
                                  </DropdownMenuItem>
                                )
                              })}
                              <DropdownMenuSeparator className="bg-white/20" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(item)}
                                className="text-red-400 hover:bg-red-500/20 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {state.totalPages > 1 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">
                Showing {((state.currentPage - 1) * 10) + 1} to {Math.min(state.currentPage * 10, state.totalCount)} of {state.totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => actions.setPage(1)}
                  disabled={state.currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={actions.prevPage}
                  disabled={state.currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-white px-4">
                  Page {state.currentPage} of {state.totalPages}
                </span>
                <Button
                  onClick={actions.nextPage}
                  disabled={state.currentPage === state.totalPages}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => actions.setPage(state.totalPages)}
                  disabled={state.currentPage === state.totalPages}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black/90 border-white/20 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="bg-black/90 border-white/20 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete {state.selectedItems.length} selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}