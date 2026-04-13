import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function FacultyAvailabilityPage() {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    requestJson({ method: 'GET', url: '/actions/faculty_availability.php' }).then((data) => {
      setNotes(data?.availability_notes || '')
    })
  }, [])

  async function save() {
    try {
      const result = await requestJson({
        method: 'POST',
        url: '/actions/faculty_availability.php',
        data: { availability_notes: notes },
      })
      toast.success(result.message || 'Saved')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Availability Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Example: No classes on Friday after 12 PM"
        />
        <Button onClick={save}>Save Preferences</Button>
      </CardContent>
    </Card>
  )
}
