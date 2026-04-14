import { EntityManager } from '@/components/shared/entity-manager'

export function AdminDepartmentsPage() {
  return (
    <EntityManager
      title="Departments"
      endpoint="/actions/departments"
      formInModal
      createLabel="Add Department"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
      ]}
      fields={[
        { name: 'name', label: 'Department Name', type: 'text', required: true },
        { name: 'code', label: 'Department Code', type: 'text', required: true },
      ]}
      defaultForm={{ name: '', code: '' }}
    />
  )
}
