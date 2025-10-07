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
  type: {
    type: DataTypes.STRING,
    defaultValue: 'standard'
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
  seatMap: {
    type: DataTypes.JSONB,
    defaultValue: {} // Estructura: { "A": { "1": "available", "2": "vip" } }
  },
  branchId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'rooms'
});

module.exports = Room;