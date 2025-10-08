const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  formats: {
  type: DataTypes.ARRAY(DataTypes.STRING),
  defaultValue: ['2D'],
  validate: {
    isValidFormat(value) {
      if (value) {
        const validFormats = ['2D', '3D', 'IMAX', '4DX', 'VIP'];
        value.forEach(format => {
          if (!validFormats.includes(format)) {
            throw new Error(`Formato inválido: ${format}`);
          }
        });
      }
    }
  }
},
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    defaultValue: 'active'
  },
  location: {
    type: DataTypes.STRING
  },
  rows: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  seatsPerRow: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12
  },
  // ✅ Mapa de asientos con tipos
  seatMap: {
    type: DataTypes.JSONB,
    defaultValue: {} // Estructura: { "A1": { "type": "standard", "price": 10.00 } }
  },
  branchId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  // ✅ Agregar roomTypeId para la relación
  roomTypeId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'rooms'
});

module.exports = Room;