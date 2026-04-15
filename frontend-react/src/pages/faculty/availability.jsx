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
    <Card className="rounded-[14px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-5 pb-3 pt-5 sm:px-6">
        <CardTitle className="text-[28px] font-bold leading-none tracking-[-0.02em] text-slate-800">Availability Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
        <Textarea
          className="min-h-36 border-slate-200/70 bg-white"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Example: No classes on Friday after 12 PM"
        />
        <Button className="h-10 rounded-[10px] bg-blue-600 px-5 text-white transition-all duration-200 hover:bg-blue-700" onClick={save}>
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  )
}
