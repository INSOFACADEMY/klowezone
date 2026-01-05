'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  isActive: boolean
}

interface Membership {
  organizationId: string
  organization: Organization
  role: 'OWNER' | 'MEMBER' | 'VIEWER'
}

interface OrgContext {
  userId: string
  organization: Organization
  role: 'OWNER' | 'MEMBER' | 'VIEWER'
}

export function OrganizationSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setError(null)

      // Get current org context
      const response = await fetch('/api/me/org', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization data')
      }

      const data: OrgContext = await response.json()
      setActiveOrg(data.organization)

      // Get all memberships for this user
      const membershipsResponse = await fetch('/api/me/memberships', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (membershipsResponse.ok) {
        const membershipsData = await membershipsResponse.json()
        setMemberships(membershipsData.memberships || [])
      }

    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError('Failed to load organizations')
    }
  }

  const switchOrganization = async (orgId: string) => {
    if (orgId === activeOrg?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/me/org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ orgId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to switch organization')
      }

      const data = await response.json()

      // Update active org
      setActiveOrg(data.organization)

      // Close dropdown
      setIsOpen(false)

      // Refresh the page to update all data
      router.refresh()

    } catch (err) {
      console.error('Error switching organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch organization')
    } finally {
      setIsLoading(false)
    }
  }

  const getToken = () => {
    // Try to get token from localStorage, cookies, or other sources
    if (typeof window !== 'undefined') {
      // Try localStorage first
      const localToken = localStorage.getItem('auth-token') ||
                        localStorage.getItem('token') ||
                        localStorage.getItem('jwt')
      if (localToken) return localToken

      // Try cookies
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] ||
                         document.cookie.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1] ||
                         document.cookie.split(';').find(c => c.trim().startsWith('jwt='))?.split('=')[1]
      if (cookieToken) return cookieToken
    }
    return ''
  }

  // If only one organization, show simple display
  if (memberships.length <= 1 && activeOrg) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-100 truncate max-w-32">
          {activeOrg.name}
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 transition-colors",
          isOpen && "bg-slate-800/50 border-slate-600/50"
        )}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-100 truncate">
            {activeOrg?.name || 'Loading...'}
          </span>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={cn(
            "w-4 h-4 text-slate-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} />
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {memberships.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400 text-center">
                No organizations found
              </div>
            ) : (
              memberships.map((membership) => {
                const isActive = membership.organizationId === activeOrg?.id
                return (
                  <button
                    key={membership.organizationId}
                    onClick={() => switchOrganization(membership.organizationId)}
                    disabled={isLoading}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-700/50 transition-colors flex items-center justify-between",
                      isActive && "bg-slate-700/70 text-emerald-400"
                    )}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-100 truncate">
                          {membership.organization.name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {membership.role.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
