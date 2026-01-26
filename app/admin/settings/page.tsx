import { requireRole } from '@/lib/auth-helpers'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { AdminSettings } from '@/components/admin/AdminSettings'

export default async function AdminSettingsPage() {
  await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

  return (
    <AuthenticatedLayout>
      <AdminSettings />
    </AuthenticatedLayout>
  )
}
