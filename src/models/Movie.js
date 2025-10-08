const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Movie = sequelize.define('Movie', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duración en minutos'
  },
  rating: {
    type: DataTypes.FLOAT,
    validate: {
      min: 0,
      max: 10
    }
  },
  poster: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  releaseDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('coming_soon', 'now_playing', 'finished'),
    defaultValue: 'now_playing'
  }
}, {
  tableName: 'movies'
});

module.exports = Movie;