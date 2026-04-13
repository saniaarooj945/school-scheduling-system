import { EntityManager } from '@/components/shared/entity-manager'

export function AdminSessionsPage() {
  return (
    <EntityManager
      title="Academic Sessions"
      endpoint="/actions/sessions.php"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'start_date', label: 'Start Date' },
        { key: 'end_date', label: 'End Date' },
      ]}
      fields={[
        { name: 'name', label: 'Session Name', type: 'text', required: true },
        { name: 'start_date', label: 'Start Date', type: 'date', required: true },
        { name: 'end_date', label: 'End Date', type: 'date', required: true },
      ]}
      defaultForm={{ name: '', start_date: '', end_date: '' }}
    />
  )
}
