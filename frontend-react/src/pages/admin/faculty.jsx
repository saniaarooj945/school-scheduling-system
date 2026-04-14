import { useEffect, useState } from 'react'
import { EntityManager } from '@/components/shared/entity-manager'
import { fetchList } from '@/lib/crud'

export function AdminFacultyPage() {
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    fetchList('/actions/departments').then((rows) => {
      setDepartments((rows || []).map((row) => ({ value: String(row.id), label: row.name })))
    })
  }, [])

  return (
    <EntityManager
      title="Faculty"
      endpoint="/actions/faculty"
      formInModal
      createLabel="Add Faculty"
      columns={[
        { key: 'full_name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'department_name', label: 'Department' },
      ]}
      fields={[
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'department_id', label: 'Department', type: 'select', options: departments },
        { name: 'availability_notes', label: 'Availability Notes', type: 'textarea', fullWidth: true },
      ]}
      defaultForm={{
        full_name: '',
        email: '',
        password: '',
        department_id: '',
        availability_notes: '',
      }}
      preprocessPayload={(payload) => ({
        ...payload,
        department_id: payload.department_id ? Number(payload.department_id) : null,
      })}
    />
  )
}
