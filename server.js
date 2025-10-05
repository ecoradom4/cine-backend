require('dotenv').config();
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor de cine...');
    
    // Probar conexión a la base de datos
    await testConnection();
    
    // Sincronizar modelos con la base de datos
    // En producción usar { alter: true } con cuidado, mejor usar migraciones
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false }  // En producción, usar migraciones manuales
      : { alter: true };  // En desarrollo, alterar tablas automáticamente
    
    await sequelize.sync(syncOptions);
    console.log('✅ Modelos sincronizados con la base de datos');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🎬 Servidor de cine ejecutándose en puerto ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal de terminación (SIGINT)');
  await sequelize.close();
  console.log('✅ Conexión a la base de datos cerrada');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal de terminación (SIGTERM)');
  await sequelize.close();
  console.log('✅ Conexión a la base de datos cerrada');
  process.exit(0);
});

startServer();