#!/usr/bin/env tsx

/**
 * Script de prueba para verificar el estado de una cuenta publicitaria de Meta (Facebook)
 * Uso: npm run tsx scripts/test-meta.ts
 */

import { config } from 'dotenv'

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' })

interface MetaAccountResponse {
  account_status: number;
  disable_reason?: number;
  id: string;
}

async function checkMetaAccountStatus(): Promise<void> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken) {
    console.error('❌ Error: META_ACCESS_TOKEN no está configurado en las variables de entorno');
    console.log('💡 Configura tu access token en el archivo .env.local:');
    console.log('   META_ACCESS_TOKEN=tu_access_token_aqui');
    process.exit(1);
  }

  if (!adAccountId) {
    console.error('❌ Error: META_AD_ACCOUNT_ID no está configurado en las variables de entorno');
    console.log('💡 Configura tu account ID en el archivo .env.local:');
    console.log('   META_AD_ACCOUNT_ID=tu_account_id_aqui');
    process.exit(1);
  }

  const accountId = `act_${adAccountId}`;
  const apiUrl = `https://graph.facebook.com/v24.0/${accountId}?fields=account_status,disable_reason&access_token=${accessToken}`;

  console.log('🔍 Verificando estado de cuenta publicitaria Meta...');
  console.log(`📡 Account ID: ${accountId}`);
  console.log(`🌐 URL: ${apiUrl.replace(accessToken, '***TOKEN***')}`);
  console.log('');

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error en la respuesta de Meta API:');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorData.error?.message || 'Unknown error'}`);
      console.error(`   Code: ${errorData.error?.code || 'Unknown code'}`);

      if (response.status === 401) {
        console.log('\n💡 Posibles causas:');
        console.log('   - Access token expirado o inválido');
        console.log('   - Access token no tiene permisos para esta cuenta');
        console.log('   - Account ID incorrecto');
      } else if (response.status === 403) {
        console.log('\n💡 Posibles causas:');
        console.log('   - La cuenta no está asociada con el access token');
        console.log('   - La cuenta está deshabilitada');
      }

      process.exit(1);
    }

    const data: MetaAccountResponse = await response.json();

    console.log('✅ Respuesta exitosa de Meta API:');
    console.log(`   Account ID: ${data.id}`);
    console.log(`   Account Status: ${data.account_status}`);

    // Interpretar el estado de la cuenta
    switch (data.account_status) {
      case 1:
        console.log('🟢 Estado: ACTIVA');
        console.log('   La cuenta publicitaria está activa y lista para crear campañas.');
        break;

      case 2:
        console.log('🔴 Estado: DESHABILITADA');
        console.log('   La cuenta publicitaria está deshabilitada.');
        if (data.disable_reason) {
          console.log(`   Razón de deshabilitación: ${getDisableReasonText(data.disable_reason)}`);
        }
        break;

      case 3:
        console.log('🟡 Estado: EN REVISIÓN');
        console.log('   La cuenta está en proceso de revisión por Meta.');
        break;

      case 7:
        console.log('⏸️ Estado: PAUSADA');
        console.log('   La cuenta está pausada temporalmente.');
        break;

      case 9:
        console.log('⏳ Estado: PENDIENTE');
        console.log('   La cuenta está pendiente de aprobación.');
        break;

      case 101:
        console.log('🚫 Estado: RECHAZADA');
        console.log('   La cuenta fue rechazada por Meta.');
        break;

      default:
        console.log(`❓ Estado: DESCONOCIDO (${data.account_status})`);
        console.log('   Estado no reconocido. Consulta la documentación de Meta.');
    }

    console.log('\n📊 Resumen completo:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error(`   ${error instanceof Error ? error.message : 'Error desconocido'}`);

    console.log('\n💡 Posibles causas:');
    console.log('   - Sin conexión a internet');
    console.log('   - Firewall bloqueando la conexión');
    console.log('   - API de Meta temporalmente no disponible');

    process.exit(1);
  }
}

/**
 * Convierte el código de razón de deshabilitación a texto legible
 */
function getDisableReasonText(reasonCode: number): string {
  const reasons: Record<number, string> = {
    0: 'Otra razón',
    1: 'Políticas de publicidad violadas',
    2: 'Información de facturación inválida',
    3: 'Información de negocio inválida',
    4: 'Información de contacto inválida',
    5: 'Actividad inusual detectada',
    6: 'Información de impuestos inválida',
    7: 'Cuenta suspendida por múltiples violaciones',
    8: 'Contenido no permitido',
    9: 'Información de identidad inválida',
    10: 'Información de ubicación inválida'
  };

  return reasons[reasonCode] || `Código de razón desconocido: ${reasonCode}`;
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  checkMetaAccountStatus().catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

export { checkMetaAccountStatus };
