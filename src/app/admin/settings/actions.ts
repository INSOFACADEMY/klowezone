'use server'

import { getOrgContext } from '@/lib/tenant/getOrgContext'
import { testEmailConnection as testEmailProviderConnection, testAIConnection as testAIProviderConnection, testStorageConnection as testStorageProviderConnection, getEmailProviderForOrg, getAIProviderForOrg, getStorageProviderForOrg } from '@/lib/config-services'

export async function testEmailConnection(id: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const { orgId } = await getOrgContext()

    // Validate that the email provider belongs to the organization
    const provider = await getEmailProviderForOrg(id, orgId)

    if (!provider) {
      return { success: false, message: 'Proveedor no encontrado o acceso denegado', error: 'NOT_FOUND' }
    }

    // Test the connection using the existing service
    const result = await testEmailProviderConnection(id)
    return result
  } catch (error) {
    console.error('Error testing email connection:', error)
    return {
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function testAIConnection(id: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const { orgId } = await getOrgContext()

    // Validate that the AI provider belongs to the organization
    const provider = await getAIProviderForOrg(id, orgId)

    if (!provider) {
      return { success: false, message: 'Proveedor no encontrado o acceso denegado', error: 'NOT_FOUND' }
    }

    // Test the connection using the existing service
    const result = await testAIProviderConnection(id)
    return result
  } catch (error) {
    console.error('Error testing AI connection:', error)
    return {
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function testStorageConnection(id: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const { orgId } = await getOrgContext()

    // Validate that the storage provider belongs to the organization
    const provider = await getStorageProviderForOrg(id, orgId)

    if (!provider) {
      return { success: false, message: 'Proveedor no encontrado o acceso denegado', error: 'NOT_FOUND' }
    }

    // Test the connection using the existing service
    const result = await testStorageProviderConnection(id)
    return result
  } catch (error) {
    console.error('Error testing storage connection:', error)
    return {
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
