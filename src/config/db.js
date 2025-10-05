const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL (formato de conexión completo)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Usar configuración por partes
  sequelize = new Sequelize(
    process.env.DB_NAME || 'neondb',
    process.env.DB_USER || 'neondb_owner',
    process.env.DB_PASSWORD || 'npg_HgL4hmxJfeA8',
    {
      host: process.env.DB_HOST || 'ep-tiny-lake-afmmoy4y-pooler.c-2.us-west-2.aws.neon.tech',
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a Neon PostgreSQL establecida correctamente.');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
  }
};

module.exports = { sequelize, testConnection };