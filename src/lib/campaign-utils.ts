/**
 * Utilidades para el sistema de rastreo de campañas
 */

export const CAMPAIGN_STORAGE_KEY = 'klowezone_campaign_id'
export const CAMPAIGN_EXPIRY_KEY = 'klowezone_campaign_expiry'

/**
 * Obtiene el campaign ID almacenado en localStorage
 * Verifica expiración automáticamente
 */
export const getStoredCampaignId = (): string | null => {
  if (typeof window === 'undefined') return null

  const expiryString = localStorage.getItem(CAMPAIGN_EXPIRY_KEY)
  if (!expiryString) return null

  const expiryDate = new Date(expiryString)
  const now = new Date()

  if (now > expiryDate) {
    // Expirado, limpiar
    localStorage.removeItem(CAMPAIGN_STORAGE_KEY)
    localStorage.removeItem(CAMPAIGN_EXPIRY_KEY)
    return null
  }

  return localStorage.getItem(CAMPAIGN_STORAGE_KEY)
}

/**
 * Limpia manualmente el campaign ID almacenado
 */
export const clearStoredCampaignId = (): void => {
  if (typeof window === 'undefined') return

  localStorage.removeItem(CAMPAIGN_STORAGE_KEY)
  localStorage.removeItem(CAMPAIGN_EXPIRY_KEY)
  console.log('🧹 CampaignTracker: Campaña eliminada manualmente')
}

/**
 * Almacena un campaign ID con expiración de 30 días
 */
export const storeCampaignId = (campaignId: string): void => {
  if (typeof window === 'undefined') return

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)

  localStorage.setItem(CAMPAIGN_STORAGE_KEY, campaignId)
  localStorage.setItem(CAMPAIGN_EXPIRY_KEY, expiryDate.toISOString())

  console.log(`📊 CampaignTracker: ID de campaña guardado: ${campaignId}, expira: ${expiryDate.toISOString()}`)
}
