'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { User, Save } from 'lucide-react'
import { toast } from 'sonner'

export function ProfileForm() {
  const { user } = useSupabaseAuth()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    lightreachSalesRepName: '',
    lightreachSalesRepEmail: '',
    lightreachSalesRepPhone: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        lightreachSalesRepName: user.lightreachSalesRepName ?? '',
        lightreachSalesRepEmail: user.lightreachSalesRepEmail ?? '',
        lightreachSalesRepPhone: user.lightreachSalesRepPhone ?? '',
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user?.id) return
    try {
      setSaving(true)
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lightreachSalesRepName: formData.lightreachSalesRepName.trim() || null,
          lightreachSalesRepEmail: formData.lightreachSalesRepEmail.trim() || null,
          lightreachSalesRepPhone: formData.lightreachSalesRepPhone.trim() || null,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setFormData({
          lightreachSalesRepName: updated.lightreachSalesRepName ?? '',
          lightreachSalesRepEmail: updated.lightreachSalesRepEmail ?? '',
          lightreachSalesRepPhone: updated.lightreachSalesRepPhone ?? '',
        })
        toast.success('Profile updated')
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error ?? 'Failed to update profile')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            LightReach sales rep info
          </CardTitle>
          <CardDescription>
            This information is shown on finance applications you submit. Leave blank to use your company default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lightreachSalesRepName">Name</Label>
            <Input
              id="lightreachSalesRepName"
              value={formData.lightreachSalesRepName}
              onChange={(e) => setFormData((p) => ({ ...p, lightreachSalesRepName: e.target.value }))}
              placeholder="e.g. Austin Elkins"
              aria-label="Sales rep name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lightreachSalesRepEmail">Email</Label>
            <Input
              id="lightreachSalesRepEmail"
              type="email"
              value={formData.lightreachSalesRepEmail}
              onChange={(e) => setFormData((p) => ({ ...p, lightreachSalesRepEmail: e.target.value }))}
              placeholder="e.g. austin@kinhome.com"
              aria-label="Sales rep email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lightreachSalesRepPhone">Phone</Label>
            <Input
              id="lightreachSalesRepPhone"
              type="tel"
              value={formData.lightreachSalesRepPhone}
              onChange={(e) => setFormData((p) => ({ ...p, lightreachSalesRepPhone: e.target.value }))}
              placeholder="e.g. 801-928-6369"
              aria-label="Sales rep phone"
            />
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving} aria-label="Save profile">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
