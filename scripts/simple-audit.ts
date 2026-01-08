/**
 * SIMPLE AUDIT - KLOWEZONE
 *
 * Verificación básica de conectividad
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 SIMPLE AUDIT");
  console.log("================\n");

  try {
    console.log("Testing Prisma connection...");

    // Test básico de conexión
    await prisma.$connect();
    console.log("✅ Prisma connection: OK");

    // Test básico de consulta
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Basic query: OK");

    console.log("\n🎯 RESULTADO: Sistema operativo");

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", message);
    console.log("\n🔧 Posibles soluciones:");
    console.log("1. Verificar DATABASE_URL en .env.local");
    console.log("2. Verificar conexión a base de datos");
    console.log("3. Ejecutar: npx prisma db push");
  } finally {
    await prisma.$disconnect();
  }
}

main();




