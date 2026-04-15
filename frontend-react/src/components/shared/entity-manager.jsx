import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableEmptyState } from '@/components/shared/table-empty-state'
import { createItem, deleteItem, fetchPaged, updateItem } from '@/lib/crud'
import { toast } from 'sonner'

const PAGE_SIZES = [25, 50, 75, 100]

const valueOf = (field, formState) => {
  if (field.type === 'number') return Number(formState[field.name] ?? 0)
  return formState[field.name] ?? ''
}

export function EntityManager({
  title,
  endpoint,
  columns,
  fields,
  preprocessPayload,
  defaultForm,
  afterLoad,
  extraActions,
  formInModal = true,
  createLabel,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [formState, setFormState] = useState(defaultForm)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const load = async (next = {}) => {
    const currentPage = next.page ?? page
    const currentPageSize = next.pageSize ?? pageSize
    const currentQuery = next.query ?? query
    try {
      setLoading(true)
      const data = await fetchPaged(endpoint, { page: currentPage, pageSize: currentPageSize, q: currentQuery })
      setItems(data.items || [])
      setTotal(data.total || 0)
      if (afterLoad) afterLoad(data.items || [])
    } catch (error) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || error?.message || 'Failed to load data'
      toast.error(status ? `${status}: ${message}` : message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, pageSize])

  const onSearch = () => {
    const normalizedQuery = String(query ?? '').trim()
    setQuery(normalizedQuery)
    setPage(1)
    load({ page: 1, query: normalizedQuery })
  }

  const resetForm = () => {
    setEditingId(null)
    setFormState(defaultForm)
    setIsFormOpen(false)
    setQuery('')
    setPage(1)
    load({ page: 1, query: '' })
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      let payload = fields.reduce((acc, field) => {
        acc[field.name] = valueOf(field, formState)
        return acc
      }, {})

      if (preprocessPayload) {
        payload = preprocessPayload(payload)
      }

      if (editingId) {
        await updateItem(endpoint, { ...payload, id: editingId })
        toast.success('Updated successfully')
      } else {
        await createItem(endpoint, payload)
        toast.success('Created successfully')
      }
      resetForm()
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Save failed')
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await deleteItem(endpoint, id)
      toast.success('Deleted successfully')
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed')
    }
  }

  const actionRenderer = useMemo(() => extraActions || (() => null), [extraActions])

  const openCreateForm = () => {
    setEditingId(null)
    setFormState(defaultForm)
    setIsFormOpen(true)
  }

  const openEditForm = (item) => {
    setEditingId(item.id)
    setFormState(
      fields.reduce((acc, field) => {
        acc[field.name] = item[field.name] ?? ''
        return acc
      }, {})
    )
    setIsFormOpen(true)
  }

  const shouldShowInlineForm = !formInModal
  const showModalForm = formInModal && isFormOpen

  return (
    <div className="space-y-6">
      <Card className="rounded-[12px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <CardHeader className="flex flex-row items-center justify-between px-5 pb-4 pt-5">
          <CardTitle className="text-[28px] font-bold leading-none tracking-[-0.02em] text-slate-800">{title}</CardTitle>
          {formInModal ? (
            <Button
              className="h-11 rounded-[8px] bg-blue-600 px-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              onClick={openCreateForm}
            >
              {createLabel || `Add ${title}`}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5 px-5 pb-5">
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-slate-200 bg-white p-4">
            <Label className="text-sm font-semibold text-slate-700">Search</Label>
            <Input
              placeholder="Search by name or code"
              value={query}
              onChange={(e) => {
                const nextQuery = e.target.value
                setQuery(nextQuery)
                if (!String(nextQuery).trim()) {
                  setPage(1)
                  load({ page: 1, query: '' })
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSearch()
                }
              }}
              className="h-10 w-full max-w-sm bg-white md:w-72"
            />
            <Button className="h-10 rounded-[8px] bg-blue-600 px-4 text-white transition-all duration-200 hover:bg-blue-700" onClick={onSearch}>
              Search
            </Button>
            {/* <Button variant="outline" className="h-10 rounded-[8px] border-slate-300 bg-white px-4" onClick={resetForm}>
              Reset Form
            </Button> */}
          </div>

          <Table className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                {columns.map((column) => (
                  <TableHead key={column.key} className="bg-slate-100 font-semibold text-slate-700">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableEmptyState colSpan={columns.length + 1} title="No records found" message="There is no data available for this table." />
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="odd:bg-white even:bg-slate-50/80">
                    {columns.map((column) => (
                      <TableCell key={`${item.id}-${column.key}`}>
                        {column.render ? column.render(item) : item[column.key]}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md border-yellow-400 bg-yellow-400 text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-500 hover:bg-yellow-500 hover:shadow-md"
                          onClick={() => openEditForm(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-md bg-rose-500 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-md"
                          onClick={() => onDelete(item.id)}
                        >
                          Delete
                        </Button>
                        {actionRenderer(item, load)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-sm text-slate-600">
              Showing page {page} of {totalPages} · Total {total}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-[8px] border border-slate-300 bg-white px-2"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="rounded-[8px]" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button variant="outline" className="rounded-[8px]" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {shouldShowInlineForm ? (
        <Card className="rounded-[12px] border-slate-200/70 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          <CardHeader className="px-5 pb-4 pt-5">
            <CardTitle className="text-[20px] font-bold leading-none text-slate-800">{editingId ? `Edit ${title}` : `Add ${title}`}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                  <Label>{field.label}</Label>
                  {field.type === 'select' ? (
                    <select
                      className="mt-1 h-10 w-full rounded-[8px] border border-slate-300 bg-white px-3"
                      value={formState[field.name] ?? ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      required={field.required}
                    >
                      <option value="">-- Select --</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      className="mt-1"
                      value={formState[field.name] ?? ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      className="mt-1"
                      type={field.type || 'text'}
                      min={field.min}
                      value={formState[field.name] ?? ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <Button type="submit" className="h-11 rounded-[8px] bg-blue-600 px-5 text-white hover:bg-blue-700">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {showModalForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[1px]">
          <Card className="w-full max-w-[500px] overflow-hidden rounded-[10px] border border-slate-100/60 bg-white shadow-[0_20px_64px_rgba(15,23,42,0.22)]">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="text-[26px] font-bold leading-none tracking-[-0.01em] text-slate-800">{editingId ? `Edit ${title}` : `Add ${title}`}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white px-5 pb-4 pt-2">
              <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2.5">
                {fields.map((field) => (
                  <div key={field.name}>
                    <Label>{field.label}</Label>
                    {field.type === 'select' ? (
                      <select
                        className="mt-1 h-10 w-full rounded-[8px] border border-slate-200/70 bg-white px-3"
                        value={formState[field.name] ?? ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.required}
                      >
                        <option value="">-- Select --</option>
                        {(field.options || []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        className="mt-1 border-slate-200/70"
                        value={formState[field.name] ?? ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        className="mt-1 border-slate-200/70"
                        type={field.type || 'text'}
                        min={field.min}
                        value={formState[field.name] ?? ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" className="h-10 rounded-[8px] bg-slate-600 px-5 text-white hover:bg-slate-700" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 rounded-[8px] bg-blue-600 px-5 text-white hover:bg-blue-700"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
