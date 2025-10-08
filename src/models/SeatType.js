const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SeatType = sequelize.define('SeatType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  priceMultiplier: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1.0
  },
  description: {
    type: DataTypes.TEXT
  },
  color: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'seat_types'
});

module.exports = SeatType;