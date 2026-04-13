import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createItem, deleteItem, fetchPaged, updateItem } from '@/lib/crud'
import { toast } from 'sonner'

const PAGE_SIZES = [25, 50, 75, 100]

function valueOf(field, formState) {
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
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [formState, setFormState] = useState(defaultForm)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function load() {
    try {
      setLoading(true)
      const data = await fetchPaged(endpoint, { page, pageSize, q: query })
      setItems(data.items || [])
      setTotal(data.total || 0)
      if (afterLoad) afterLoad(data.items || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, pageSize])

  function onSearch() {
    setPage(1)
    load()
  }

  function resetForm() {
    setEditingId(null)
    setFormState(defaultForm)
  }

  async function onSubmit(event) {
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

  async function onDelete(id) {
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

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full max-w-sm bg-white md:w-72"
            />
            <Button className="h-10 bg-blue-600 text-white hover:bg-blue-700" onClick={onSearch}>
              Search
            </Button>
            <Button variant="outline" className="h-10 border-slate-300 bg-white" onClick={resetForm}>
              Reset Form
            </Button>
          </div>

          <Table className="overflow-hidden rounded-lg border border-slate-200">
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                {columns.map((column) => (
                  <TableHead key={column.key} className="bg-slate-100 text-slate-700">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="bg-slate-100 text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>No records found.</TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
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
                          onClick={() => {
                            setEditingId(item.id)
                            setFormState(
                              fields.reduce((acc, field) => {
                                acc[field.name] = item[field.name] ?? ''
                                return acc
                              }, {})
                            )
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>
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
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · Total {total}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-2"
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
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>{editingId ? `Edit ${title}` : `Add ${title}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <Label>{field.label}</Label>
                {field.type === 'select' ? (
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3"
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
              <Button type="submit" className="h-10 bg-blue-600 text-white hover:bg-blue-700">
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
