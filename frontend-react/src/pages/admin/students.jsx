import { useEffect, useState } from 'react'
import { EntityManager } from '@/components/shared/entity-manager'
import { fetchList } from '@/lib/crud'

export function AdminStudentsPage() {
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    fetchList('/actions/departments.php').then((rows) => {
      setDepartments((rows || []).map((row) => ({ value: String(row.id), label: row.name })))
    })
  }, [])

  return (
    <EntityManager
      title="Students"
      endpoint="/actions/students.php"
      columns={[
        { key: 'full_name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'department_name', label: 'Department' },
        { key: 'semester', label: 'Semester' },
        { key: 'section', label: 'Section' },
      ]}
      fields={[
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'department_id', label: 'Department', type: 'select', options: departments },
        { name: 'semester', label: 'Semester', type: 'number', min: 1, required: true },
        { name: 'section', label: 'Section', type: 'text', required: true },
      ]}
      defaultForm={{
        full_name: '',
        email: '',
        password: '',
        department_id: '',
        semester: 1,
        section: 'A',
      }}
      preprocessPayload={(payload) => ({
        ...payload,
        department_id: payload.department_id ? Number(payload.department_id) : null,
        semester: Number(payload.semester || 1),
      })}
    />
  )
}
