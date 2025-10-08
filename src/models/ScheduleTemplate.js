const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ScheduleTemplate = sequelize.define('ScheduleTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  daysOfWeek: {
    type: DataTypes.ARRAY(DataTypes.INTEGER), // [0,1,2,3,4,5,6]
    allowNull: false
  },
  showtimeSlots: {
    type: DataTypes.ARRAY(DataTypes.TIME), // ['14:00', '16:30', '19:00']
    allowNull: false
  },
  audioType: {
    type: DataTypes.ENUM('original', 'dubbed', 'subtitled'),
    defaultValue: 'original'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'completed'),
    defaultValue: 'active'
  },
  // Agregar campos de relación
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
  templateId: {
    type: DataTypes.UUID
  }
}, {
  tableName: 'schedule_templates'
});

module.exports = ScheduleTemplate;