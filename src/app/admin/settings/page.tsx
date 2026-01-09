'use client'

import { useState, useEffect } from 'react'
import { Settings, Mail, Cpu, HardDrive, Shield, Eye, EyeOff, Save, TestTube, CheckCircle, XCircle, Loader2, Plus, Edit, Trash2 } from 'lucide-react'
import { testEmailConnection, testAIConnection, testStorageConnection } from './actions'
// Simplified imports for now

type EmailProvider = {
  id: string
  name: string
  provider: 'smtp' | 'sendgrid' | 'resend'
  config: any
  isActive: boolean
  isDefault: boolean
}

type AIProvider = {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google'
  model: string
  config: any
  isActive: boolean
  isDefault: boolean
  rateLimit: number
  monthlyLimit: number
}

type StorageProvider = {
  id: string
  name: string
  provider: 's3' | 'r2' | 'local'
  config: any
  bucket: string
  region?: string
  isActive: boolean
  isDefault: boolean
}

type Role = {
  id: string
  name: string
  description: string
  permissions: Array<{ id: string; name: string }>
  _count: { users: number }
}

type Permission = {
  id: string
  name: string
  description: string
  category: string
}

type SecurityConfig = {
  jwtSecret: string
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  requireSpecialChars: boolean
  requireNumbers: boolean
  requireUppercase: boolean
}

export default function AdminSettingsPage() {
  // State management
  const [activeTab, setActiveTab] = useState<'email' | 'ai' | 'storage' | 'security'>('email')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Data state
  const [emailProviders, setEmailProviders] = useState<EmailProvider[]>([])
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([])
  const [storageProviders, setStorageProviders] = useState<StorageProvider[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    jwtSecret: '',
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    passwordMinLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
  })

  // Form state
  const [emailForm, setEmailForm] = useState({
    name: '',
    provider: 'smtp' as const,
    isActive: false,
    isDefault: false,
    config: {} as any
  })

  const [aiForm, setAiForm] = useState({
    name: '',
    provider: 'openai' as const,
    isActive: false,
    isDefault: false,
    rateLimit: 100,
    monthlyLimit: 10000,
    config: {} as any
  })

  const [storageForm, setStorageForm] = useState({
    name: '',
    provider: 's3' as const,
    isActive: false,
    isDefault: false,
    config: {} as any
  })

  // Load data (mock for now)
  useEffect(() => {
    setLoading(true)
    // Simulate loading with mock data
    setTimeout(() => {
      setEmailProviders([
        {
          id: '1',
          name: 'Gmail SMTP',
          provider: 'smtp',
          config: { host: 'smtp.gmail.com', port: 587, user: 'user@gmail.com', pass: 'encrypted' },
          isActive: true,
          isDefault: true
        }
      ])
      setAiProviders([
        {
          id: '1',
          name: 'OpenAI GPT-4',
          provider: 'openai',
          model: 'gpt-4',
          config: { apiKey: 'encrypted', model: 'gpt-4', maxTokens: 4096, temperature: 0.7 },
          isActive: true,
          isDefault: true,
          rateLimit: 100,
          monthlyLimit: 10000
        }
      ])
      setStorageProviders([
        {
          id: '1',
          name: 'AWS S3 Main',
          provider: 's3',
          config: { accessKeyId: 'encrypted', secretAccessKey: 'encrypted', region: 'us-east-1', bucket: 'klowezone-files' },
          bucket: 'klowezone-files',
          region: 'us-east-1',
          isActive: true,
          isDefault: true
        }
      ])
      setRoles([
        {
          id: '1',
          name: 'Super Admin',
          description: 'Acceso completo al sistema',
          permissions: [
            { id: '1', name: 'users.manage' },
            { id: '2', name: 'settings.manage' },
            { id: '3', name: 'projects.manage' }
          ],
          _count: { users: 1 }
        },
        {
          id: '2',
          name: 'Admin',
          description: 'Gestión de contenido y usuarios',
          permissions: [
            { id: '1', name: 'users.manage' },
            { id: '4', name: 'content.manage' }
          ],
          _count: { users: 3 }
        }
      ])
      setPermissions([
        { id: '1', name: 'users.manage', description: 'Gestionar usuarios', category: 'Users' },
        { id: '2', name: 'settings.manage', description: 'Configurar sistema', category: 'System' },
        { id: '3', name: 'projects.manage', description: 'Administrar proyectos', category: 'Projects' },
        { id: '4', name: 'content.manage', description: 'Gestionar contenido', category: 'Content' }
      ])
      setSecurityConfig({
        jwtSecret: 'your-super-secret-jwt-key-here',
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordMinLength: 12,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
      })
      setLoading(false)
    }, 1000)
  }, [])

  // Helper functions
  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSave = async (section: string, data: any) => {
    setSaving(section)
    try {
      console.log(`Saving ${section}:`, data)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } catch (error) {
      console.error(`Error saving ${section}:`, error)
    } finally {
      setSaving(null)
    }
  }

  const handleTestConnection = async (type: string, id: string) => {
    setTesting(id)
    try {
      let result
      switch (type) {
        case 'email':
          result = await testEmailConnection(id)
          break
        case 'ai':
          result = await testAIConnection(id)
          break
        case 'storage':
          result = await testStorageConnection(id)
          break
        default:
          result = { success: false, message: 'Tipo no soportado' }
      }

      alert(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    } catch (error) {
      alert('❌ Error al probar la conexión')
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando configuraciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
        <p className="text-slate-400 mt-1">
          Gestiona integraciones, proveedores y configuraciones del sistema
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
        {[
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'ai', label: 'IA', icon: Cpu },
          { id: 'storage', label: 'Almacenamiento', icon: HardDrive },
          { id: 'security', label: 'Seguridad', icon: Shield }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Email Providers List */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Proveedores de Email</h3>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Nuevo Proveedor
                </button>
              </div>
            </div>
            <div className="p-6">
              {emailProviders.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No hay proveedores de email configurados</p>
                  <p className="text-slate-500 text-sm">Agrega un proveedor para enviar emails</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{provider.name}</h4>
                          <p className="text-slate-400 text-sm capitalize">{provider.provider}</p>
                        </div>
                        {provider.isDefault && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                            Predeterminado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestConnection('email', provider.id)}
                          disabled={testing === provider.id}
                          className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
                        >
                          {testing === provider.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </button>
                        <button className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add New Email Provider Form */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Configurar Nuevo Proveedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-100 text-sm mb-2">Nombre del Proveedor</label>
                <input
                  type="text"
                  placeholder="Mi Proveedor SMTP"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                  value={emailForm.name}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-slate-100 text-sm mb-2">Tipo de Proveedor</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  value={emailForm.provider}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, provider: e.target.value as any }))}
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="resend">Resend</option>
                </select>
              </div>
            </div>

            {/* SMTP Configuration */}
            {emailForm.provider === 'smtp' && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Host SMTP</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={emailForm.config.host || ''}
                      onChange={(e) => setEmailForm(prev => ({
                        ...prev,
                        config: { ...prev.config, host: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Puerto</label>
                    <input
                      type="number"
                      placeholder="587"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={emailForm.config.port || ''}
                      onChange={(e) => setEmailForm(prev => ({
                        ...prev,
                        config: { ...prev.config, port: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-100 text-sm mb-2">Usuario</label>
                  <input
                    type="email"
                    placeholder="tu-email@gmail.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                    value={emailForm.config.user || ''}
                    onChange={(e) => setEmailForm(prev => ({
                      ...prev,
                      config: { ...prev.config, user: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-slate-100 text-sm mb-2">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showSecrets['email-pass'] ? 'text' : 'password'}
                      placeholder="tu-app-password"
                      className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={emailForm.config.pass || ''}
                      onChange={(e) => setEmailForm(prev => ({
                        ...prev,
                        config: { ...prev.config, pass: e.target.value }
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('email-pass')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showSecrets['email-pass'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={emailForm.isActive}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Activo</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={emailForm.isDefault}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Predeterminado</span>
                </label>
              </div>
              <button
                onClick={() => handleSave('email', emailForm)}
                disabled={saving === 'email'}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving === 'email' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 inline" />
                    Guardar Proveedor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Providers List */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Proveedores de IA</h3>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Nuevo Proveedor
                </button>
              </div>
            </div>
            <div className="p-6">
              {aiProviders.length === 0 ? (
                <div className="text-center py-8">
                  <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No hay proveedores de IA configurados</p>
                  <p className="text-slate-500 text-sm">Agrega un proveedor para usar IA en la plataforma</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{provider.name}</h4>
                          <p className="text-slate-400 text-sm capitalize">{provider.provider} - {provider.model}</p>
                        </div>
                        {provider.isDefault && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                            Predeterminado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestConnection('ai', provider.id)}
                          disabled={testing === provider.id}
                          className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
                        >
                          {testing === provider.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </button>
                        <button className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add New AI Provider Form */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Configurar Nuevo Proveedor de IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-100 text-sm mb-2">Nombre del Proveedor</label>
                <input
                  type="text"
                  placeholder="Mi OpenAI"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                  value={aiForm.name}
                  onChange={(e) => setAiForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-slate-100 text-sm mb-2">Tipo de Proveedor</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  value={aiForm.provider}
                  onChange={(e) => setAiForm(prev => ({ ...prev, provider: e.target.value as any }))}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google AI</option>
                </select>
              </div>
            </div>

            {/* OpenAI Configuration */}
            {aiForm.provider === 'openai' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-slate-100 text-sm mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showSecrets['openai-key'] ? 'text' : 'password'}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={aiForm.config.apiKey || ''}
                      onChange={(e) => setAiForm(prev => ({
                        ...prev,
                        config: { ...prev.config, apiKey: e.target.value }
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('openai-key')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showSecrets['openai-key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Modelo</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                      value={aiForm.config.model || 'gpt-4'}
                      onChange={(e) => setAiForm(prev => ({
                        ...prev,
                        config: { ...prev.config, model: e.target.value }
                      }))}
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4o">GPT-4o</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Rate Limit</label>
                    <input
                      type="number"
                      placeholder="100"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={aiForm.rateLimit}
                      onChange={(e) => setAiForm(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Límite Mensual</label>
                    <input
                      type="number"
                      placeholder="10000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={aiForm.monthlyLimit}
                      onChange={(e) => setAiForm(prev => ({ ...prev, monthlyLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={aiForm.isActive}
                    onChange={(e) => setAiForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Activo</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={aiForm.isDefault}
                    onChange={(e) => setAiForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Predeterminado</span>
                </label>
              </div>
              <button
                onClick={() => handleSave('ai', aiForm)}
                disabled={saving === 'ai'}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving === 'ai' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 inline" />
                    Guardar Proveedor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Providers List */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Proveedores de Almacenamiento</h3>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Nuevo Proveedor
                </button>
              </div>
            </div>
            <div className="p-6">
              {storageProviders.length === 0 ? (
                <div className="text-center py-8">
                  <HardDrive className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No hay proveedores de almacenamiento configurados</p>
                  <p className="text-slate-500 text-sm">Agrega un proveedor para almacenar archivos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {storageProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{provider.name}</h4>
                          <p className="text-slate-400 text-sm capitalize">{provider.provider} - {provider.bucket}</p>
                        </div>
                        {provider.isDefault && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                            Predeterminado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestConnection('storage', provider.id)}
                          disabled={testing === provider.id}
                          className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
                        >
                          {testing === provider.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </button>
                        <button className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add New Storage Provider Form */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Configurar Nuevo Proveedor de Almacenamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-100 text-sm mb-2">Nombre del Proveedor</label>
                <input
                  type="text"
                  placeholder="Mi AWS S3"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                  value={storageForm.name}
                  onChange={(e) => setStorageForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-slate-100 text-sm mb-2">Tipo de Proveedor</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  value={storageForm.provider}
                  onChange={(e) => setStorageForm(prev => ({ ...prev, provider: e.target.value as any }))}
                >
                  <option value="s3">AWS S3</option>
                  <option value="r2">Cloudflare R2</option>
                  <option value="local">Local Storage</option>
                </select>
              </div>
            </div>

            {/* S3 Configuration */}
            {storageForm.provider === 's3' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-slate-100 text-sm mb-2">Access Key ID</label>
                  <input
                    type="text"
                    placeholder="AKIA..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                    value={storageForm.config.accessKeyId || ''}
                    onChange={(e) => setStorageForm(prev => ({
                      ...prev,
                      config: { ...prev.config, accessKeyId: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-slate-100 text-sm mb-2">Secret Access Key</label>
                  <div className="relative">
                    <input
                      type={showSecrets['s3-secret'] ? 'text' : 'password'}
                      placeholder="tu-secret-key"
                      className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={storageForm.config.secretAccessKey || ''}
                      onChange={(e) => setStorageForm(prev => ({
                        ...prev,
                        config: { ...prev.config, secretAccessKey: e.target.value }
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('s3-secret')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showSecrets['s3-secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Región</label>
                    <input
                      type="text"
                      placeholder="us-east-1"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={storageForm.config.region || ''}
                      onChange={(e) => setStorageForm(prev => ({
                        ...prev,
                        config: { ...prev.config, region: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-100 text-sm mb-2">Bucket</label>
                    <input
                      type="text"
                      placeholder="mi-bucket"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                      value={storageForm.config.bucket || ''}
                      onChange={(e) => setStorageForm(prev => ({
                        ...prev,
                        config: { ...prev.config, bucket: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={storageForm.isActive}
                    onChange={(e) => setStorageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Activo</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={storageForm.isDefault}
                    onChange={(e) => setStorageForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Predeterminado</span>
                </label>
              </div>
              <button
                onClick={() => handleSave('storage', storageForm)}
                disabled={saving === 'storage'}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving === 'storage' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 inline" />
                    Guardar Proveedor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Configuration */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Configuración de Seguridad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-100 text-sm mb-2">JWT Secret</label>
                <div className="relative">
                  <input
                    type={showSecrets['jwt'] ? 'text' : 'password'}
                    placeholder="tu-jwt-secret-super-seguro"
                    className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                    value={securityConfig.jwtSecret}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, jwtSecret: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('jwt')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showSecrets['jwt'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-100 text-sm mb-2">Timeout de Sesión (segundos)</label>
                <input
                  type="number"
                  placeholder="3600"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                  value={securityConfig.sessionTimeout}
                  onChange={(e) => setSecurityConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-slate-100 text-sm mb-2">Máx. Intentos de Login</label>
                <input
                  type="number"
                  placeholder="5"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                  value={securityConfig.maxLoginAttempts}
                  onChange={(e) => setSecurityConfig(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-slate-100 text-sm mb-2">Longitud Mínima de Contraseña</label>
                <input
                  type="number"
                  placeholder="12"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
                  value={securityConfig.passwordMinLength}
                  onChange={(e) => setSecurityConfig(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-white font-medium">Requisitos de Contraseña</h4>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securityConfig.requireSpecialChars}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, requireSpecialChars: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Caracteres especiales</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securityConfig.requireNumbers}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, requireNumbers: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Números</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securityConfig.requireUppercase}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, requireUppercase: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300 text-sm">Mayúsculas</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleSave('security', securityConfig)}
                disabled={saving === 'security'}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving === 'security' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 inline" />
                    Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Roles Management */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Gestión de Roles y Permisos</h3>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{role.name}</h4>
                      <p className="text-slate-400 text-sm">{role.description}</p>
                      <p className="text-slate-500 text-xs">{role._count.users} usuarios</p>
                    </div>
                    <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors">
                      <Edit className="w-4 h-4 mr-2 inline" />
                      Editar Permisos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <span key={permission.id} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                        {permission.name}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">
                        +{role.permissions.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Status Indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Guardando configuración...</span>
          </div>
        </div>
      )}
    </div>
  )
}

