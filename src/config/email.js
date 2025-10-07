const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Validar que existan las variables de entorno
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Error: Faltan variables de entorno para el email');
    console.log('ℹ️  Asegúrate de tener EMAIL_USER y EMAIL_PASS en tu .env');
    throw new Error('Configuración de email incompleta');
  }

  console.log('📧 Configurando transporte de email con Gmail...');
  
  return nodemailer.createTransport({  // CORREGIDO: createTransport
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Función para verificar la conexión
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Servidor de email configurado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando transporte de email:', error.message);
    return false;
  }
};

module.exports = { 
  createTransporter,
  verifyTransporter 
};