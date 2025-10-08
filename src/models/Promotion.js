const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Promotion = sequelize.define('Promotion', {
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
    unique: true
  },
  type: {
    type: DataTypes.ENUM('percentage', 'fixed', 'bogo'),
    allowNull: false
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  minPurchase: {
    type: DataTypes.FLOAT
  },
  maxDiscount: {
    type: DataTypes.FLOAT
  },
  validFrom: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  validUntil: {
    type: DataTypes.DATE
  },
  usageLimit: {
    type: DataTypes.INTEGER
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT
  },
  // Relaciones
  branchId: {
    type: DataTypes.UUID
  },
  movieId: {
    type: DataTypes.UUID
  }
}, {
  tableName: 'promotions',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['validUntil']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Promotion;