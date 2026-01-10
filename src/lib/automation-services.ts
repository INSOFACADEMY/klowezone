import { prisma } from './prisma'
import { encryptObject, decryptObject, type EncryptedData } from './encryption'

// ========================================
// AUTOMATION ACTION TYPES
// ========================================

export const AUTOMATION_ACTION_TYPES = [
  'SEND_EMAIL',
  'CREATE_NOTIFICATION',
  'LOG_TO_SLACK',
  'UPDATE_RECORD',
  'CREATE_TASK',
  'RUN_AI_ANALYSIS',
  'SEND_WEBHOOK'
] as const

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number]

// ========================================
// AUTOMATION SERVICES
// ========================================

export interface AutomationWorkflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  trigger: 'NEW_LEAD' | 'PROJECT_STATUS_CHANGE' | 'FEEDBACK_RECEIVED' | 'CRITICAL_ERROR' | 'USER_REGISTERED' | 'PAYMENT_RECEIVED' | 'DEADLINE_APPROACHING'
  triggerConfig: any
  actions: AutomationAction[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface AutomationAction {
  id: string
  workflowId: string
  order: number
  type: AutomationActionType
  config: any
  delay: number
}

// ========================================
// CREATE INPUT TYPES (for API endpoints)
// ========================================

export interface AutomationActionCreateInput {
  type: AutomationActionType
  config: any
  order?: number  // Optional, will default to index
  delay?: number  // Optional, will default to 0
}

export interface AutomationWorkflowCreateInput {
  name: string
  description?: string
  isActive: boolean
  trigger: 'NEW_LEAD' | 'PROJECT_STATUS_CHANGE' | 'FEEDBACK_RECEIVED' | 'CRITICAL_ERROR' | 'USER_REGISTERED' | 'PAYMENT_RECEIVED' | 'DEADLINE_APPROACHING'
  triggerConfig: any
  actions: AutomationActionCreateInput[]
  createdBy: string
}

export interface AutomationRun {
  id: string
  workflowId: string
  triggerData: any
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
  startedAt?: Date
  completedAt?: Date
  error?: string
  retryCount: number
  maxRetries: number
}

// ========================================
// WORKFLOW MANAGEMENT
// ========================================

export async function getWorkflows(orgId: string) {
  try {
    const workflows = await prisma.automationWorkflow.findMany({
      where: { organizationId: orgId },
      include: {
        actions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: { firstName: true, lastName: true }
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { runs: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return workflows
  } catch (error) {
    console.error('Error fetching workflows:', error)
    throw new Error(`Failed to fetch workflows: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createWorkflow(orgId: string, data: AutomationWorkflowCreateInput) {
  try {
    return await prisma.automationWorkflow.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        trigger: data.trigger,
        triggerConfig: data.triggerConfig,
        organizationId: orgId,
        createdBy: data.createdBy,
        actions: {
          create: data.actions.map((action, index) => ({
            order: action.order ?? index,
            type: action.type,
            config: action.config ?? {},
            delay: action.delay ?? 0,
            organizationId: orgId
          }))
        }
      },
      include: {
        actions: true,
        creator: {
          select: { firstName: true, lastName: true }
        },
        runs: true
      }
    })
  } catch (error) {
    console.error('Error creating workflow:', error)
    throw new Error(`Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function updateWorkflow(orgId: string, id: string, data: Partial<AutomationWorkflow>) {
  try {
    // Verify the workflow belongs to the organization
    const workflow = await prisma.automationWorkflow.findFirst({
      where: { id, organizationId: orgId }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    // First, delete existing actions if we're updating them
    if (data.actions) {
      await prisma.automationAction.deleteMany({
        where: { workflowId: id, organizationId: orgId }
      })
    }

    return await prisma.automationWorkflow.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.trigger && { trigger: data.trigger }),
        ...(data.triggerConfig && { triggerConfig: data.triggerConfig }),
        ...(data.actions && {
          actions: {
            create: data.actions.map(action => ({
              order: action.order,
              type: action.type,
              config: action.config,
              delay: action.delay,
              organizationId: orgId
            }))
          }
        })
      },
      include: {
        actions: {
          orderBy: { order: 'asc' }
        }
      }
    })
  } catch (error) {
    console.error('Error updating workflow:', error)
    throw error
  }
}

export async function deleteWorkflow(orgId: string, id: string) {
  try {
    // Verify the workflow belongs to the organization
    const workflow = await prisma.automationWorkflow.findFirst({
      where: { id, organizationId: orgId }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    // This will cascade delete actions and runs due to Prisma relations
    return await prisma.automationWorkflow.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    throw new Error(`Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function toggleWorkflow(orgId: string, id: string, isActive: boolean) {
  try {
    // Verify the workflow belongs to the organization
    const workflow = await prisma.automationWorkflow.findFirst({
      where: { id, organizationId: orgId }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    return await prisma.automationWorkflow.update({
      where: { id },
      data: { isActive }
    })
  } catch (error) {
    console.error('Error toggling workflow:', error)
    throw new Error(`Failed to toggle workflow: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ========================================
// TRIGGER SYSTEM
// ========================================

export async function triggerAutomation(orgId: string, triggerType: string, triggerData: any) {
  try {
    // Find active workflows that match this trigger for the organization
    const workflows = await prisma.automationWorkflow.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        trigger: triggerType as any
      },
      include: {
        actions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    const results = []

    for (const workflow of workflows) {
      // Check if trigger conditions match
      if (checkTriggerConditions(workflow.triggerConfig, triggerData)) {
        const run = await createAutomationRun(workflow.id, triggerData)

        // Queue actions for execution
        for (const action of workflow.actions) {
          await queueJob(run.id, action.id, action.config, action.delay)
        }

        results.push(run)
      }
    }

    return results
  } catch (error) {
    console.error('Error triggering automation:', error)
    throw error
  }
}

function checkTriggerConditions(triggerConfig: any, triggerData: any): boolean {
  // Simple condition checking - can be extended for complex logic
  if (!triggerConfig.conditions) return true

  for (const condition of triggerConfig.conditions) {
    const { field, operator, value } = condition
    const fieldValue = getNestedValue(triggerData, field)

    switch (operator) {
      case 'equals':
        if (fieldValue !== value) return false
        break
      case 'contains':
        if (!fieldValue?.includes(value)) return false
        break
      case 'greater_than':
        if (fieldValue <= value) return false
        break
      case 'less_than':
        if (fieldValue >= value) return false
        break
    }
  }

  return true
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// ========================================
// AUTOMATION RUN MANAGEMENT
// ========================================

export async function createAutomationRun(workflowId: string, triggerData: any) {
  try {
    // Get organizationId from workflow
    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id: workflowId },
      select: { organizationId: true }
    })

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    return await prisma.automationRun.create({
      data: {
        workflowId,
        triggerData,
        organizationId: workflow.organizationId
      }
    })
  } catch (error) {
    console.error('Error creating automation run:', error)
    throw error
  }
}

export async function getAutomationRuns(orgId: string, workflowId?: string, limit: number = 50) {
  try {
    return await prisma.automationRun.findMany({
      where: {
        organizationId: orgId,
        ...(workflowId && { workflowId })
      },
      include: {
        workflow: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  } catch (error) {
    console.error('Error fetching automation runs:', error)
    return []
  }
}

export async function updateRunStatus(runId: string, status: string, error?: string) {
  try {
    const updateData: any = {
      status: status as any
    }

    if (status === 'PROCESSING' && !error) {
      updateData.startedAt = new Date()
    } else if (['COMPLETED', 'FAILED'].includes(status)) {
      updateData.completedAt = new Date()
      if (error) updateData.error = error
    }

    return await prisma.automationRun.update({
      where: { runId },
      data: updateData
    })
  } catch (error) {
    console.error('Error updating run status:', error)
    throw error
  }
}

// ========================================
// JOB QUEUE SYSTEM
// ========================================

export async function queueJob(runId: string, actionId: string, payload: any, delay: number = 0) {
  try {
    const scheduledFor = delay > 0
      ? new Date(Date.now() + delay * 1000)
      : new Date()

    // Get organizationId from run
    const run = await prisma.automationRun.findUnique({
      where: { id: runId },
      select: { organizationId: true }
    })

    if (!run) {
      throw new Error('Run not found')
    }

    return await prisma.jobQueue.create({
      data: {
        runId,
        actionId,
        payload,
        scheduledFor,
        organizationId: run.organizationId
      }
    })
  } catch (error) {
    console.error('Error queuing job:', error)
    throw error
  }
}

export async function getPendingJobs(orgId?: string, limit: number = 10) {
  try {
    return await prisma.jobQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date()
        },
        ...(orgId && { organizationId: orgId })
      },
      include: {
        run: {
          include: {
            workflow: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit
    })
  } catch (error) {
    console.error('Error fetching pending jobs:', error)
    return []
  }
}

export async function processJob(jobId: string) {
  try {
    // Mark job as processing
    const job = await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      },
      include: {
        run: {
          include: {
            workflow: {
              include: {
                actions: true
              }
            }
          }
        }
      }
    })

    // Execute the action
    const result = await executeAction(job.run.workflow.actions.find(a => a.id === job.actionId), job.payload)

    // Mark job as completed
    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    return result
  } catch (error) {
    console.error('Error processing job:', error)

    // Mark job as failed and potentially retry
    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    })

    throw error
  }
}

// ========================================
// ACTION EXECUTION
// ========================================

async function executeAction(action: any, payload: any) {
  try {
    switch (action.type) {
      case 'SEND_EMAIL':
        return await executeSendEmail(action.config, payload)
      case 'CREATE_NOTIFICATION':
        return await executeCreateNotification(action.config, payload)
      case 'LOG_TO_SLACK':
        return await executeLogToSlack(action.config, payload)
      case 'RUN_AI_ANALYSIS':
        return await executeRunAIAnalysis(action.config, payload)
      case 'SEND_WEBHOOK':
        return await executeSendWebhook(action.config, payload)
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  } catch (error) {
    console.error(`Error executing action ${action.type}:`, error)
    throw error
  }
}

async function executeSendEmail(config: any, payload: any) {
  // Implementation would use the email service
  console.log('Executing SEND_EMAIL:', config, payload)

  // TODO: Integrate with email service
  // const emailService = await getEmailService(config.providerId)
  // await emailService.send({
  //   to: config.recipient,
  //   subject: config.subject,
  //   body: config.body
  // })

  return { success: true, message: 'Email sent successfully' }
}

async function executeCreateNotification(config: any, payload: any) {
  // Implementation would create in-app notifications
  console.log('Executing CREATE_NOTIFICATION:', config, payload)

  // TODO: Create notification in database
  // await prisma.notification.create({
  //   data: {
  //     userId: config.userId,
  //     title: config.title,
  //     message: config.message,
  //     type: config.type
  //   }
  // })

  return { success: true, message: 'Notification created' }
}

async function executeLogToSlack(config: any, payload: any) {
  // Implementation would send to Slack webhook
  console.log('Executing LOG_TO_SLACK:', config, payload)

  // TODO: Send to Slack webhook
  // const response = await fetch(config.webhookUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: config.message,
  //     payload: payload
  //   })
  // })

  return { success: true, message: 'Logged to Slack' }
}

async function executeRunAIAnalysis(config: any, payload: any) {
  // Implementation would use AI service
  console.log('Executing RUN_AI_ANALYSIS:', config, payload)

  // TODO: Use AI service to analyze data
  // const aiService = await getAIService(config.providerId)
  // const analysis = await aiService.analyze(config.prompt, payload)

  return { success: true, message: 'AI analysis completed' }
}

async function executeSendWebhook(config: any, payload: any) {
  // Implementation would send webhook
  console.log('Executing SEND_WEBHOOK:', config, payload)

  // TODO: Send webhook to external service
  // const response = await fetch(config.url, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${config.token}`
  //   },
  //   body: JSON.stringify({
  //     event: config.event,
  //     data: payload
  //   })
  // })

  return { success: true, message: 'Webhook sent' }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

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

// ========================================
// TRIGGER HOOKS (to be called from relevant places)
// ========================================

export async function onNewLead(leadData: any) {
  return await triggerAutomation('NEW_LEAD', leadData)
}

export async function onProjectStatusChange(projectData: any) {
  return await triggerAutomation('PROJECT_STATUS_CHANGE', projectData)
}

export async function onFeedbackReceived(feedbackData: any) {
  return await triggerAutomation('FEEDBACK_RECEIVED', feedbackData)
}

export async function onCriticalError(errorData: any) {
  return await triggerAutomation('CRITICAL_ERROR', errorData)
}

export async function onUserRegistered(userData: any) {
  return await triggerAutomation('USER_REGISTERED', userData)
}

export async function onPaymentReceived(paymentData: any) {
  return await triggerAutomation('PAYMENT_RECEIVED', paymentData)
}

export async function onDeadlineApproaching(deadlineData: any) {
  return await triggerAutomation('DEADLINE_APPROACHING', deadlineData)
}


