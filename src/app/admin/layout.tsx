import { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar-simple'
import { AdminTopbar } from '@/components/admin/admin-topbar-simple'
import { AdminCommandPalette } from '@/components/admin/admin-command-palette-simple'
import { JobProcessor } from '@/components/admin/job-processor'
import { NotificationToast } from '@/components/admin/notification-toast'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <AdminTopbar />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <AdminCommandPalette />

      {/* Job Processor - Invisible background component */}
      <JobProcessor />

      {/* CGO Pulse Notifications */}
      <NotificationToast />
    </div>
  )
}
