#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Iniciando limpieza completa de cachés...\n');

// Directorios a limpiar
const dirsToClean = [
  '.next',
  '.turbo',
  'node_modules/.cache',
  'node_modules/.vite',
  '.swc',
  'dist',
  'build'
];

dirsToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`🗑️  Eliminando ${dir}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ ${dir} eliminado exitosamente`);
    } catch (error) {
      console.log(`❌ Error eliminando ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️  ${dir} no existe, saltando...`);
  }
});

console.log('\n🔄 Regenerando cliente Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma regenerado');
} catch (error) {
  console.log('❌ Error regenerando cliente Prisma:', error.message);
}

console.log('\n🎉 Limpieza completa terminada!');
console.log('💡 Ahora puedes ejecutar: npm run dev');
