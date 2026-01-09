import React from 'react';
import { Button } from './button';
import { canUseWhatsApp, generateWhatsAppLinkWithTemplate } from '@/lib/whatsapp-utils';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  telefono?: string;
  clientName: string;
  templateKey?: keyof typeof import('@/lib/whatsapp-utils').WHATSAPP_TEMPLATES;
  templateParams?: any[];
  message?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Componente de botón para WhatsApp con icono y colores de marca
 */
export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  telefono,
  clientName,
  templateKey = 'welcome',
  templateParams = [],
  message,
  size = 'sm',
  variant = 'ghost',
  className = '',
  showTooltip = true
}) => {
  // Verificar si puede usar WhatsApp
  if (!canUseWhatsApp(telefono)) {
    return null; // No mostrar el botón si no tiene teléfono válido
  }

  // Generar el enlace
  const link = message
    ? generateWhatsAppLinkWithTemplate(telefono, templateKey, clientName, templateParams)
    : generateWhatsAppLinkWithTemplate(telefono, templateKey, clientName, templateParams);

  if (!link) return null;

  const handleClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      size={size}
      variant={variant}
      className={`relative group ${className}`}
      title={showTooltip ? `Contactar a ${clientName} por WhatsApp` : undefined}
    >
      {/* Icono de WhatsApp con colores de marca */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <MessageCircle className="w-4 h-4" />
          {/* Overlay verde de WhatsApp */}
          <div className="absolute inset-0 bg-green-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
        </div>
        {/* Texto opcional para botones más grandes */}
        {size !== 'sm' && (
          <span className="hidden sm:inline">WhatsApp</span>
        )}
      </div>

      {/* Efecto hover con colores de WhatsApp */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md"></div>
    </Button>
  );
};

/**
 * Versión del botón optimizada para listas/cards (más compacta)
 */
export const WhatsAppIconButton: React.FC<Omit<WhatsAppButtonProps, 'size' | 'variant'>> = (props) => {
  return (
    <WhatsAppButton
      {...props}
      size="sm"
      variant="ghost"
      className="p-2 hover:bg-green-500/10"
      showTooltip={true}
    />
  );
};












