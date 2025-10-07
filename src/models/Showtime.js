const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Showtime = sequelize.define('Showtime', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  seatsAvailable: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Nuevo campo para el estado actual de asientos
  occupiedSeats: {
    type: DataTypes.JSONB,
    defaultValue: {} // { "A1": "occupied", "B2": "reserved" }
  }
}, {
  tableName: 'showtimes'
});

module.exports = Showtime;