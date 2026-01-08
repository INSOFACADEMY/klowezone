import AppHeader from '@/components/navigation/AppHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppHeader
        title="Dashboard"
        showBackButton={true}
        showHomeButton={false}
        isAdmin={false}
        userEmail="usuario@klowezone.com"
      />
      <div>
        {children}
      </div>
    </div>
  )
}
