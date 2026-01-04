'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { storeCampaignId, CAMPAIGN_STORAGE_KEY, CAMPAIGN_EXPIRY_KEY } from '@/lib/campaign-utils'

/**
 * CampaignTracker Component
 *
 * Rastrea parámetros de campaña de Facebook Ads y UTM
 * Guarda el campaign_id en localStorage por 30 días
 * Se debe incluir en el layout principal para rastrear en todas las páginas
 */

export function CampaignTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Buscar parámetros de campaña
    const fbCampaignId = searchParams.get('fb_campaign_id')
    const utmCampaign = searchParams.get('utm_campaign')

    // Usar fb_campaign_id primero, luego utm_campaign como fallback
    const campaignId = fbCampaignId || utmCampaign

    if (campaignId) {
      // Guardar campaign ID usando la utilidad
      storeCampaignId(campaignId)

      // Opcional: Limpiar parámetros de la URL (sin recargar la página)
      // Esto evita que el parámetro quede visible en la URL
      if (typeof window !== 'undefined' && window.history.replaceState) {
        const url = new URL(window.location.href)

        // Remover ambos parámetros si existen
        url.searchParams.delete('fb_campaign_id')
        url.searchParams.delete('utm_campaign')

        // Solo actualizar si había parámetros para remover
        if (url.href !== window.location.href) {
          window.history.replaceState({}, '', url.href)
        }
      }
    }

    // Limpiar campañas expiradas al cargar la página
    cleanupExpiredCampaigns()
  }, [searchParams])

  // Función para limpiar campañas expiradas
  const cleanupExpiredCampaigns = () => {
    const expiryString = localStorage.getItem(CAMPAIGN_EXPIRY_KEY)

    if (expiryString) {
      const expiryDate = new Date(expiryString)
      const now = new Date()

      if (now > expiryDate) {
        // Campaña expirada, limpiar
        localStorage.removeItem(CAMPAIGN_STORAGE_KEY)
        localStorage.removeItem(CAMPAIGN_EXPIRY_KEY)
        console.log('🧹 CampaignTracker: Campaña expirada eliminada del localStorage')
      }
    }
  }

  // Este componente no renderiza nada visible
  return null
}
