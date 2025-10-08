// src/models/Showtime.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Showtime = sequelize.define('Showtime', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  movieId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  branchId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  roomTypeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  audioType: {
    type: DataTypes.ENUM('subtitled', 'dubbed'),
    defaultValue: 'subtitled'
  },
  seatsAvailable: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'active', 'cancelled', 'completed'),
    defaultValue: 'scheduled'
  },
  batchId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  originalShowtimeId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'showtimes',
  indexes: [
    {
      fields: ['startsAt']
    },
    {
      fields: ['roomId', 'startsAt']
    },
    {
      fields: ['batchId']
    }
  ]
});

module.exports = Showtime;