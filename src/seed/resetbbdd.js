// src/seed/update.js
require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Movie, Room, Showtime, Booking, Branch } = require('../models');
const bcrypt = require('bcryptjs');


const resetAndSeed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    console.log('🔄 Sincronizando tablas...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas sincronizadas');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

resetAndSeed();