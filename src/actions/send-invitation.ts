'use server'

import { Resend } from 'resend'
import { createProjectInvitation } from '@/lib/project-invitations'
import { getProjectById } from '@/lib/projects'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationData {
  projectId: string
  email: string
  role: 'Admin' | 'Staff' | 'Viewer'
  customMessage?: string
}

export async function sendProjectInvitation(data: SendInvitationData) {
  try {
    // Validar datos de entrada
    if (!data.projectId || !data.email || !data.role) {
      throw new Error('Datos de invitación incompletos')
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de email inválido')
    }

    // Crear la invitación en la base de datos
    console.log('Creando invitación para:', data.email, 'en proyecto:', data.projectId)
    const invitation = await createProjectInvitation({
      proyecto_id: data.projectId,
      email: data.email,
      rol: data.role,
      notas_admin: data.customMessage
    })

    if (!invitation) {
      throw new Error('Error al crear la invitación')
    }

    // Obtener información del proyecto para el email
    const project = await getProjectById(data.projectId)
    if (!project) {
      throw new Error('Proyecto no encontrado')
    }

    // Construir URL de invitación
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join?token=${invitation.token}`

    // Enviar email con Resend
    const emailResult = await resend.emails.send({
      from: 'Klowezone <noreply@klowezone.com>',
      to: [data.email],
      subject: `Invitación a colaborar en ${project.nombre_proyecto}`,
      html: generateInvitationEmail({
        projectName: project.nombre_proyecto,
        projectDescription: project.descripcion,
        inviterEmail: 'Equipo Klowezone', // TODO: Obtener email del usuario actual
        inviterName: 'El equipo', // TODO: Obtener nombre del usuario actual
        role: data.role,
        invitationUrl,
        customMessage: data.customMessage,
        expiresAt: invitation.fecha_expiracion
      })
    })

    console.log('Email enviado exitosamente:', emailResult)

    return {
      success: true,
      invitationId: invitation.id,
      emailId: emailResult.data?.id
    }

  } catch (error) {
    console.error('Error sending invitation:', error)

    // Si hay error después de crear la invitación, podríamos querer eliminarla
    // Pero por simplicidad, la dejamos para que se pueda reenviar

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar invitación'
    }
  }
}

function generateInvitationEmail(data: {
  projectName: string
  projectDescription?: string
  inviterEmail: string
  inviterName: string
  role: string
  invitationUrl: string
  customMessage?: string
  expiresAt?: string
}) {
  const expiryDate = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('es-ES') : '7 días'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación a Klowezone</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          .role-badge { display: inline-block; background-color: #e0f2fe; color: #0277bd; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; margin: 10px 0; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 ¡Has sido invitado a Klowezone!</h1>
            <p>Únete al proyecto <strong>${data.projectName}</strong></p>
          </div>

          <div class="content">
            <p>Hola,</p>

            <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) te ha invitado a colaborar en el proyecto <strong>${data.projectName}</strong> en Klowezone.</p>

            ${data.projectDescription ? `<p><strong>Acerca del proyecto:</strong><br>${data.projectDescription}</p>` : ''}

            <div class="role-badge">
              Tu rol: ${getRoleDisplayName(data.role)}
            </div>

            ${data.customMessage ? `<p><strong>Mensaje personalizado:</strong><br>${data.customMessage}</p>` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.invitationUrl}" class="button">Aceptar Invitación</a>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Esta invitación expira el ${expiryDate}. Si no puedes hacer clic en el botón, copia y pega esta URL en tu navegador:
              <br><br>
              <a href="${data.invitationUrl}" style="color: #667eea; word-break: break-all;">${data.invitationUrl}</a>
            </div>

            <p>Si no esperabas esta invitación, puedes ignorar este email de forma segura.</p>

            <p>¡Esperamos trabajar juntos!<br>
            <strong>El equipo de Klowezone</strong></p>
          </div>

          <div class="footer">
            <p>Este email fue enviado por Klowezone - Gestión de proyectos inteligente</p>
            <p>¿Preguntas? Contáctanos en <a href="mailto:support@klowezone.com">support@klowezone.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'Admin': return 'Administrador'
    case 'Staff': return 'Equipo'
    case 'Viewer': return 'Observador'
    default: return role
  }
}
