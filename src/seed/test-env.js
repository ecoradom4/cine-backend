require('dotenv').config();

console.log('🔍 Verificando variables de entorno...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurado' : '❌ Faltante');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Faltante');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Verificar que las variables necesarias existan
const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Variables faltantes:', missingVars.join(', '));
  console.log('💡 Asegúrate de que tu archivo .env esté en la raíz del proyecto');
} else {
  console.log('\n✅ Todas las variables requeridas están configuradas');
}