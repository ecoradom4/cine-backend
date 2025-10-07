require('dotenv').config();
const { createTransporter, verifyTransporter } = require('../config/email');

const testEmailFinal = async () => {
  try {
    console.log('🎯 Prueba final de configuración de email');
    console.log('=========================================');
    
    // 1. Verificar variables
    console.log('\n1. 📋 Verificando variables de entorno...');
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Variables faltantes:');
      console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'NO');
      console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'SÍ' : 'NO');
      return;
    }
    console.log('✅ Variables encontradas');

    // 2. Verificar conexión
    console.log('\n2. 🔗 Probando conexión con Gmail...');
    const isConnected = await verifyTransporter();
    if (!isConnected) {
      console.log('❌ No se pudo conectar');
      return;
    }
    console.log('✅ Conexión exitosa');

    // 3. Enviar email de prueba
    console.log('\n3. 📤 Enviando email de prueba...');
    const transporter = createTransporter();
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: '🎉 ¡Configuración Exitosa! - Cine Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c5aa0; text-align: center;">¡Todo está funcionando! 🎬</h1>
          <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; border-left: 4px solid #2c5aa0;">
            <h3>✅ Configuración de Email Exitosa</h3>
            <p>El sistema de tickets de <strong>Cine Connect</strong> puede ahora enviar tickets por email.</p>
            <p><strong>Usuario:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>Hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <p style="text-align: center; color: #666; margin-top: 20px;">
            Los usuarios recibirán sus tickets con QR codes automáticamente.
          </p>
        </div>
      `
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 ID del mensaje:', result.messageId);
    console.log('👀 Revisa tu bandeja de entrada en: ', process.env.EMAIL_USER);
    
    console.log('\n🎉 ¡Configuración completada! El sistema de email está listo.');

  } catch (error) {
    console.error('\n❌ Error final:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Solución para error de autenticación:');
      console.log('   1. Ve a: https://myaccount.google.com/security');
      console.log('   2. Habilita "Verificación en 2 pasos"');
      console.log('   3. Ve a: https://myaccount.google.com/apppasswords');
      console.log('   4. Genera una nueva contraseña para "Mail"');
      console.log('   5. Usa esa contraseña de 16 dígitos en EMAIL_PASS');
    }
  }
};

testEmailFinal();