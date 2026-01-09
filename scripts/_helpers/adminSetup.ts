import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/lib/auth'
import { randomBytes } from 'crypto'

export interface AdminSetupParams {
  email?: string
  userId?: string
  password?: string
  orgSlug?: string
  orgName?: string
}

export async function getOrCreateSuperAdminRole(prisma: PrismaClient): Promise<string> {
  // Buscar role superadmin existente
  let superAdminRole = await prisma.role.findUnique({
    where: { name: 'superadmin' }
  })

  if (!superAdminRole) {
    console.log('   📝 Creando role superadmin...')
    superAdminRole = await prisma.role.create({
      data: {
        name: 'superadmin',
        description: 'Super Administrator with full access',
        isSystem: true
      }
    })
    console.log('   ✅ Role superadmin creado:', superAdminRole.id)
  } else {
    console.log('   ℹ️ Role superadmin ya existe:', superAdminRole.id)
  }

  return superAdminRole.id
}

export async function generateAdminPassword(params: AdminSetupParams): Promise<string> {
  // Usar password de env var si existe, sino usar parámetro, sino generar uno random
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD || params.password
  if (envPassword) {
    console.log('   🔐 Usando password proporcionado')
    return envPassword
  }

  // Generar password random de 16 caracteres
  const randomPassword = randomBytes(8).toString('hex') // 16 caracteres hex
  console.log('   🔐 Password generado (guárdalo):', randomPassword)
  console.log('   💡 Para usar un password específico, setea ADMIN_INITIAL_PASSWORD en .env')

  return randomPassword
}

export async function getOrCreateAdminUser(
  prisma: PrismaClient,
  params: AdminSetupParams & { email: string; userId: string; roleId: string }
): Promise<any> {
  // Buscar usuario existente
  let adminUser = await prisma.user.findUnique({
    where: { id: params.userId }
  })

  if (!adminUser) {
    // Generar password y hashearlo
    console.log('   🔐 Generando password para admin...')
    const plainPassword = await generateAdminPassword(params)
    const hashedPassword = await hashPassword(plainPassword)

    adminUser = await prisma.user.create({
      data: {
        id: params.userId,
        email: params.email,
        password: hashedPassword,
        roleId: params.roleId,
        firstName: 'Super',
        lastName: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    console.log('   ✅ Usuario admin creado en Prisma:', adminUser.id)
  } else {
    console.log('   ℹ️ Usuario admin ya existe en Prisma:', adminUser.id)
  }

  return adminUser
}

export async function getOrCreateDefaultOrganization(
  prisma: PrismaClient,
  params: AdminSetupParams
): Promise<any> {
  const orgName = params.orgName || 'KloweZone'

  // Buscar organización existente por nombre
  let defaultOrg = await prisma.organization.findFirst({
    where: { name: orgName }
  })

  if (!defaultOrg) {
    // Si no hay org existente, usar el slug proporcionado o generar uno basado en el nombre
    const finalSlug = params.orgSlug || orgName.toLowerCase().replace(/\s+/g, '-')

    defaultOrg = await prisma.organization.create({
      data: {
        name: orgName,
        slug: finalSlug,
        description: `Organización principal de ${orgName}`
      }
    })
    console.log('   ✅ Organización creada:', defaultOrg.id)
  } else {
    console.log('   ℹ️ Organización ya existe:', defaultOrg.id)
  }

  return defaultOrg
}


