import { Resend } from 'resend'

// Configurar Resend (necesita API key)
const resend = new Resend(process.env.RESEND_API_KEY || '')

export interface InvitationEmailData {
  to: string
  projectName: string
  inviterName: string
  inviterEmail: string
  role: string
  invitationUrl: string
  expiryDate: string
}

export interface WelcomeEmailData {
  to: string
  userName: string
  projectName: string
  role: string
}

/**
 * Envía un email de invitación profesional
 */
export async function sendInvitationEmail(data: InvitationEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.')
      return { success: false, error: 'Email service not configured' }
    }

    const { to, projectName, inviterName, inviterEmail, role, invitationUrl, expiryDate } = data

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a proyecto - Klowezone</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px 16px 0 0; }
        .logo { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .content { background: #1e293b; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
        .invitation-card { background: #334155; border: 1px solid #475569; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .project-name { font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 8px; }
        .role-badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin: 8px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #334155; color: #94a3b8; font-size: 14px; }
        .expiry { background: #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Klowezone</div>
            <h1 style="color: #f1f5f9; margin: 16px 0; font-size: 24px;">Invitación al Proyecto</h1>
        </div>

        <div class="content">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Hola,
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                <strong>${inviterName}</strong> (${inviterEmail}) te ha invitado a colaborar en un proyecto en Klowezone.
            </p>

            <div class="invitation-card">
                <div class="project-name">${projectName}</div>
                <div class="role-badge">Rol: ${role}</div>
                <p style="margin: 16px 0; color: #cbd5e1;">
                    Únete al equipo y comienza a colaborar en este proyecto profesional.
                </p>
            </div>

            <div style="text-align: center;">
                <a href="${invitationUrl}" class="cta-button">
                    Aceptar Invitación
                </a>
            </div>

            <div class="expiry">
                <strong>Importante:</strong> Esta invitación expira el ${expiryDate}.
                Si no puedes acceder al enlace, copia y pega esta URL en tu navegador: ${invitationUrl}
            </div>

            <div class="footer">
                <p>¿No esperabas esta invitación? Puedes ignorar este email de forma segura.</p>
                <p style="margin-top: 16px;">
                    <a href="https://klowezone.com" style="color: #3b82f6; text-decoration: none;">Visita Klowezone</a> |
                    <a href="mailto:support@klowezone.com" style="color: #3b82f6; text-decoration: none;">Soporte</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`

    const result = await resend.emails.send({
      from: 'Klowezone <invitaciones@klowezone.com>',
      to: [to],
      subject: `Invitación a colaborar en "${projectName}" - Klowezone`,
      html: emailHtml,
      replyTo: inviterEmail
    })

    console.log('Email enviado exitosamente:', result)
    return { success: true, emailId: result.data?.id }

  } catch (error) {
    console.error('Error enviando email de invitación:', error)
    return { success: false, error: 'Failed to send invitation email' }
  }
}

/**
 * Envía un email de bienvenida cuando un usuario se une al proyecto
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.')
      return { success: false, error: 'Email service not configured' }
    }

    const { to, userName, projectName, role } = data

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Klowezone</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px 16px 0 0; }
        .logo { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .content { background: #1e293b; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
        .welcome-card { background: #334155; border: 1px solid #10b981; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #334155; color: #94a3b8; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Klowezone</div>
            <h1 style="color: #f1f5f9; margin: 16px 0; font-size: 24px;">¡Bienvenido al Equipo!</h1>
        </div>

        <div class="content">
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 24px;">
                ¡Hola <strong>${userName}</strong>! 🎉
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Te has unido exitosamente al proyecto <strong>"${projectName}"</strong> con el rol de <strong>${role}</strong>.
            </p>

            <div class="welcome-card">
                <h3 style="margin: 0 0 16px 0; color: #10b981;">¿Qué sigue?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1;">
                    <li>Explora las tareas asignadas en el proyecto</li>
                    <li>Configura tu perfil y preferencias</li>
                    <li>Conoce al resto del equipo</li>
                    <li>¡Empieza a colaborar!</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                    Ir al Dashboard
                </a>
            </div>

            <div class="footer">
                <p>¿Necesitas ayuda? Nuestro equipo de soporte está aquí para ayudarte.</p>
                <p style="margin-top: 16px;">
                    <a href="https://klowezone.com" style="color: #10b981; text-decoration: none;">Visita Klowezone</a> |
                    <a href="mailto:support@klowezone.com" style="color: #10b981; text-decoration: none;">Soporte</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`

    const result = await resend.emails.send({
      from: 'Klowezone <bienvenido@klowezone.com>',
      to: [to],
      subject: `¡Bienvenido a "${projectName}"! - Klowezone`,
      html: emailHtml
    })

    console.log('Email de bienvenida enviado exitosamente:', result)
    return { success: true, emailId: result.data?.id }

  } catch (error) {
    console.error('Error enviando email de bienvenida:', error)
    return { success: false, error: 'Failed to send welcome email' }
  }
}
