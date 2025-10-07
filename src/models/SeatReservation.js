const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SeatReservation = sequelize.define('SeatReservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  showtimeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  seats: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('reserved', 'confirmed', 'expired'),
    defaultValue: 'reserved'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sessionId: {
    type: DataTypes.STRING // Para identificar la sesión del usuario
  }
}, {
  tableName: 'seat_reservations',
  indexes: [
    {
      fields: ['expiresAt']
    },
    {
      fields: ['showtimeId', 'status']
    }
  ]
});

module.exports = SeatReservation;