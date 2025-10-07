const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  seats: {
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'expired'),
    defaultValue: 'pending'
  },
  ticketNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  qrCode: {
    type: DataTypes.TEXT // Base64 del QR code
  },
  expiresAt: {
    type: DataTypes.DATE // Para reservas pendientes de pago
  }
}, {
  tableName: 'bookings',
  hooks: {
    beforeCreate: async (booking) => {
      if (!booking.ticketNumber) {
        booking.ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }
  }
});

module.exports = Booking;