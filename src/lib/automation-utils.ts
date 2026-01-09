// ========================================
// AUTOMATION UTILS - Client-Safe Functions
// ========================================

/**
 * Obtiene la descripción en español de un trigger de automatización
 */
export function getTriggerDescription(trigger: string): string {
  const descriptions = {
    NEW_LEAD: 'Cuando se registra un nuevo lead',
    PROJECT_STATUS_CHANGE: 'Cuando cambia el estado de un proyecto',
    FEEDBACK_RECEIVED: 'Cuando se recibe feedback',
    CRITICAL_ERROR: 'Cuando ocurre un error crítico',
    USER_REGISTERED: 'Cuando un usuario se registra',
    PAYMENT_RECEIVED: 'Cuando se recibe un pago',
    DEADLINE_APPROACHING: 'Cuando se acerca una fecha límite'
  }
  return descriptions[trigger as keyof typeof descriptions] || trigger
}

/**
 * Obtiene la descripción en español de una acción de automatización
 */
export function getActionDescription(action: string): string {
  const descriptions = {
    SEND_EMAIL: 'Enviar email',
    CREATE_NOTIFICATION: 'Crear notificación in-app',
    LOG_TO_SLACK: 'Enviar mensaje a Slack',
    UPDATE_RECORD: 'Actualizar registro',
    CREATE_TASK: 'Crear tarea',
    RUN_AI_ANALYSIS: 'Ejecutar análisis con IA',
    SEND_WEBHOOK: 'Enviar webhook'
  }
  return descriptions[action as keyof typeof descriptions] || action
}

/**
 * Obtiene el color correspondiente a un estado de automatización
 */
export function getWorkflowStatusColor(isActive: boolean): string {
  return isActive ? 'bg-green-500' : 'bg-gray-500'
}

/**
 * Obtiene el texto correspondiente a un estado de automatización
 */
export function getWorkflowStatusText(isActive: boolean): string {
  return isActive ? 'Activo' : 'Inactivo'
}

/**
 * Obtiene el icono correspondiente a un estado de automatización
 */
export function getWorkflowStatusIcon(isActive: boolean) {
  return isActive ? '🟢' : '⚫'
}










