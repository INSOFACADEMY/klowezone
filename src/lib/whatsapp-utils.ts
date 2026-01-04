/**
 * Utilidades para integración con WhatsApp
 */

/**
 * Limpia y formatea un número de teléfono para WhatsApp
 * @param phoneNumber Número de teléfono sin procesar
 * @param defaultCountryCode Código de país por defecto (ej: '52' para México)
 * @returns Número formateado para WhatsApp o null si es inválido
 */
export function formatPhoneNumber(phoneNumber: string | undefined, defaultCountryCode: string = '52'): string | null {
  if (!phoneNumber) return null;

  // Remover todos los caracteres no numéricos
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Si está vacío después de limpiar, retornar null
  if (!cleaned) return null;

  // Si ya tiene el prefijo +, retornarlo tal cual
  if (phoneNumber.startsWith('+')) {
    return cleaned;
  }

  // Si tiene 10 dígitos (número mexicano sin código), agregar +52
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // Si ya tiene código de país (11-15 dígitos), retornarlo
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return cleaned;
  }

  // Número inválido
  return null;
}

/**
 * Genera un enlace de WhatsApp con mensaje personalizado
 * @param phoneNumber Número de teléfono formateado
 * @param message Mensaje a enviar
 * @returns URL completa de WhatsApp
 */
export function generateWhatsAppLink(phoneNumber: string, message?: string): string {
  const baseUrl = 'https://wa.me/';
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `${baseUrl}${phoneNumber}${encodedMessage}`;
}

/**
 * Templates de mensajes para WhatsApp
 */
export const WHATSAPP_TEMPLATES = {
  /**
   * Saludo inicial para nuevos clientes
   */
  welcome: (clientName: string) => `Hola ${clientName}, te contacto desde Klowezone. ¿Cómo podemos ayudarte hoy?`,

  /**
   * Notificación de hito completado
   */
  milestoneCompleted: (clientName: string, milestoneName: string) =>
    `Hola ${clientName}, te contacto de Klowezone para informarte que hemos completado el hito: ${milestoneName}.`,

  /**
   * Recordatorio de pago
   */
  paymentReminder: (clientName: string, projectName: string) =>
    `Hola ${clientName}, te recordamos que hay un pago pendiente para el proyecto ${projectName}. ¿Podemos agendar una llamada?`,

  /**
   * Actualización de proyecto
   */
  projectUpdate: (clientName: string, projectName: string, status: string) =>
    `Hola ${clientName}, actualizamos el estado del proyecto ${projectName}: ${status}. ¿Tienes alguna pregunta?`,

  /**
   * Reprogramación de reunión
   */
  meetingReschedule: (clientName: string) =>
    `Hola ${clientName}, necesitamos reprogramar nuestra reunión. ¿Qué día de la semana te queda mejor?`,

  /**
   * Documento compartido
   */
  documentShared: (clientName: string, documentName: string) =>
    `Hola ${clientName}, hemos compartido el documento "${documentName}" en tu portal de cliente. ¿Lo has podido revisar?`
};

/**
 * Verifica si un cliente tiene teléfono válido para WhatsApp
 * @param telefono Campo teléfono del cliente
 * @returns true si puede usar WhatsApp
 */
export function canUseWhatsApp(telefono: string | undefined): boolean {
  if (!telefono) return false;

  // Si es el valor por defecto de "no tiene teléfono", no puede usar WhatsApp
  if (telefono === '0000000000') return false;

  // Intentar formatear el número
  const formatted = formatPhoneNumber(telefono);
  return formatted !== null && formatted.length >= 10;
}

/**
 * Genera un enlace de WhatsApp con template personalizado
 * @param telefono Teléfono del cliente
 * @param templateKey Clave del template a usar
 * @param clientName Nombre del cliente
 * @param params Parámetros adicionales para el template
 * @returns URL de WhatsApp o null si no es posible
 */
export function generateWhatsAppLinkWithTemplate(
  telefono: string | undefined,
  templateKey: keyof typeof WHATSAPP_TEMPLATES,
  clientName: string,
  params: any[] = []
): string | null {
  if (!canUseWhatsApp(telefono)) return null;

  const formattedPhone = formatPhoneNumber(telefono);
  if (!formattedPhone) return null;

  const message = (WHATSAPP_TEMPLATES[templateKey] as any)(clientName, ...params);
  return generateWhatsAppLink(formattedPhone, message);
}


