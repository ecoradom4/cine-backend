require('dotenv').config();
const { sequelize } = require('../config/db');
const { Branch, Room, Showtime, Movie } = require('../models');

const updateSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Sincronizar solo los nuevos modelos/campos
    console.log('🔄 Actualizando esquema...');
    
    // Agregar nuevas tablas
    await Branch.sync({ alter: true });
    await sequelize.models.SeatReservation.sync({ alter: true });
    
    // Actualizar tablas existentes con nuevos campos
    await Room.sync({ alter: true });
    await Showtime.sync({ alter: true });
    await Movie.sync({ alter: true });
    await Booking.sync({ alter: true });

    console.log('✅ Esquema actualizado correctamente');

    // Crear sucursal por defecto si no existe
    const [defaultBranch] = await Branch.findOrCreate({
      where: { name: 'Cine Telares' },
      defaults: {
        address: 'Carretera a Ciudad Vieja Km. 8.5',
        city: 'Antigua Guatemala',
        phone: '8567 8900',
        openingHours: '10:00 - 23:00'
      }
    });

    console.log('✅ Sucursal por defecto creada:', defaultBranch.name);

  } catch (error) {
    console.error('❌ Error actualizando esquema:', error);
  } finally {
    await sequelize.close();
  }
};

updateSchema();