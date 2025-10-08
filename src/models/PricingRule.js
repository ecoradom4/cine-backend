const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PricingRule = sequelize.define('PricingRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('time_based', 'day_based', 'special', 'format_based'),
    allowNull: false
  },
  roomTypeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  seatTypeId: {
    type: DataTypes.UUID
  },
  audioType: {
    type: DataTypes.ENUM('original', 'dubbed', 'subtitled')
  },
  format: {
    type: DataTypes.ENUM('2D', '3D', 'IMAX', '4DX')
  },
  dayOfWeek: {
    type: DataTypes.INTEGER, // 0-6 (Domingo-Sábado)
    validate: {
      min: 0,
      max: 6
    }
  },
  startTime: {
    type: DataTypes.TIME
  },
  endTime: {
    type: DataTypes.TIME
  },
  multiplier: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0
  },
  fixedPrice: {
    type: DataTypes.FLOAT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  validFrom: {
    type: DataTypes.DATE
  },
  validUntil: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'pricing_rules'
});

module.exports = PricingRule;