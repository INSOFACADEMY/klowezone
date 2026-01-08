import AppHeader from '@/components/navigation/AppHeader'
import AdminProtection from '@/components/admin/AdminProtection'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProtection>
      <div className="min-h-screen bg-slate-950">
        <AppHeader
          showBackButton={true}
          showHomeButton={true}
          isAdmin={true}
          userEmail="admin@klowezone.com"
        />
        <div className="p-6">
          {children}
        </div>
      </div>
    </AdminProtection>
  )
}