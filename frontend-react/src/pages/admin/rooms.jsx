import { EntityManager } from '@/components/shared/entity-manager'

const roomTypes = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'lab', label: 'Lab' },
  { value: 'hall', label: 'Hall' },
]

export function AdminRoomsPage() {
  return (
    <EntityManager
      title="Rooms"
      endpoint="/actions/rooms.php"
      columns={[
        { key: 'room_number', label: 'Room Number' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'room_type', label: 'Type' },
      ]}
      fields={[
        { name: 'room_number', label: 'Room Number', type: 'text', required: true },
        { name: 'capacity', label: 'Capacity', type: 'number', min: 1, required: true },
        { name: 'room_type', label: 'Type', type: 'select', options: roomTypes, required: true },
      ]}
      defaultForm={{ room_number: '', capacity: 30, room_type: 'classroom' }}
      preprocessPayload={(payload) => ({
        ...payload,
        capacity: Number(payload.capacity || 30),
      })}
    />
  )
}
