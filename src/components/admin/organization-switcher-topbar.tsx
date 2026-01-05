'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Check, Loader2, Search, Crown, Users, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  isActive: boolean
  role: 'OWNER' | 'MEMBER' | 'VIEWER'
  joinedAt: string
  isCurrent: boolean
}

interface OrgData {
  organizations: Organization[]
  currentOrgId: string | null
  total: number
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'OWNER':
      return <Crown className="w-3 h-3" />
    case 'MEMBER':
      return <Users className="w-3 h-3" />
    case 'VIEWER':
      return <Eye className="w-3 h-3" />
    default:
      return null
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'OWNER':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'MEMBER':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'VIEWER':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

export function OrganizationSwitcherTopbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<OrgData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showToast, setShowToast] = useState(false)
  const router = useRouter()

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setError(null)

      // Get organizations list
      const response = await fetch('/api/me/orgs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const orgData: OrgData = await response.json()
      setData(orgData)

    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError('Failed to load organizations')
    }
  }

  const switchOrganization = async (orgId: string) => {
    if (orgId === data?.currentOrgId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/me/org/switch', {
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

      const result = await response.json()

      // Update local state
      setData(prev => prev ? {
        ...prev,
        currentOrgId: orgId,
        organizations: prev.organizations.map(org => ({
          ...org,
          isCurrent: org.id === orgId
        }))
      } : null)

      // Close dropdown
      setIsOpen(false)
      setSearchQuery('')

      // Show success toast
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      // Refresh the page to update all data
      router.refresh()

    } catch (err) {
      console.error('Error switching organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch organization')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrganizations = useMemo(() => {
    if (!data?.organizations) return []

    return data.organizations.filter(org =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [data?.organizations, searchQuery])

  const currentOrg = data?.organizations.find(org => org.isCurrent)

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

  // If only one organization, show simple display with tooltip
  if (data && data.organizations.length <= 1) {
    return (
      <div className="relative group">
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-700/30 cursor-not-allowed opacity-75">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-100 truncate max-w-32">
            {currentOrg?.name || 'Loading...'}
          </span>
          {currentOrg && (
            <div className={cn(
              "flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium border",
              getRoleColor(currentOrg.role)
            )}>
              {getRoleIcon(currentOrg.role)}
              <span className="capitalize">{currentOrg.role.toLowerCase()}</span>
            </div>
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Solo tienes acceso a una organización
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 transition-colors min-w-[200px]",
          isOpen && "bg-slate-800/50 border-slate-600/50"
        )}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-100 truncate">
              {currentOrg?.name || 'Loading...'}
            </div>
            {currentOrg && (
              <div className="flex items-center space-x-1 mt-0.5">
                <div className={cn(
                  "flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                  getRoleColor(currentOrg.role)
                )}>
                  {getRoleIcon(currentOrg.role)}
                  <span className="capitalize">{currentOrg.role.toLowerCase()}</span>
                </div>
              </div>
            )}
          </div>
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
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar organizaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Organizations List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOrganizations.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">
                {searchQuery ? 'No se encontraron organizaciones' : 'No hay organizaciones disponibles'}
              </div>
            ) : (
              <div className="py-1">
                {filteredOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => switchOrganization(org.id)}
                    disabled={isLoading}
                    className={cn(
                      "w-full text-left px-3 py-3 hover:bg-slate-700/50 transition-colors border-l-2",
                      org.isCurrent
                        ? "bg-slate-700/70 border-l-emerald-400"
                        : "border-l-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-100 truncate">
                            {org.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {org.slug}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className={cn(
                          "flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border",
                          getRoleColor(org.role)
                        )}>
                          {getRoleIcon(org.role)}
                          <span className="capitalize">{org.role.toLowerCase()}</span>
                        </div>

                        {org.isCurrent && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 shadow-lg backdrop-blur-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">
                  Organización cambiada
                </p>
                <p className="text-xs text-slate-400">
                  Los datos se han actualizado correctamente
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
