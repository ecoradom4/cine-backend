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
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  location: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'rooms'
});

module.exports = Room;