import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function FacultyAvailabilityPage() {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    requestJson({ method: 'GET', url: '/actions/faculty_availability' }).then((data) => {
      setNotes(data?.availability_notes || '')
    })
  }, [])

  async function save() {
    try {
      const result = await requestJson({
        method: 'POST',
        url: '/actions/faculty_availability',
        data: { availability_notes: notes },
      })
      toast.success(result.message || 'Saved')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <Card className="border-slate-200 bg-[#f4f6fb] shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-800">Availability Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          className="min-h-36 border-slate-300 bg-white"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Example: No classes on Friday after 12 PM"
        />
        <Button className="h-10 rounded-md bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700" onClick={save}>
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  )
}
