const { Showtime, Movie, Room, Booking } = require('../models');
const { Op } = require('sequelize');

const getAllShowtimes = async (req, res, next) => {
  try {
    const { movieId, roomId, date } = req.query;
    
    const where = {};
    
    if (movieId) where.movieId = movieId;
    if (roomId) where.roomId = roomId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.startsAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const showtimes = await Showtime.findAll({
      where,
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' }
      ],
      order: [['startsAt', 'ASC']]
    });

    res.json({
      success: true,
      data: showtimes
    });
  } catch (error) {
    next(error);
  }
};

const getShowtimeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const showtime = await Showtime.findByPk(id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' },
        { 
          model: Booking, 
          as: 'bookings',
          include: ['user']
        }
      ]
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    res.json({
      success: true,
      data: showtime
    });
  } catch (error) {
    next(error);
  }
};

const createShowtime = async (req, res, next) => {
  try {
    const showtimeData = req.body;
    
    // Verificar que la película y sala existen
    const movie = await Movie.findByPk(showtimeData.movieId);
    const room = await Room.findByPk(showtimeData.roomId);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    const showtime = await Showtime.create({
      ...showtimeData,
      seatsAvailable: room.capacity
    });

    const showtimeWithDetails = await Showtime.findByPk(showtime.id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Función creada exitosamente',
      data: showtimeWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const updateShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const showtimeData = req.body;

    const showtime = await Showtime.findByPk(id);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    await showtime.update(showtimeData);

    const updatedShowtime = await Showtime.findByPk(id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' }
      ]
    });

    res.json({
      success: true,
      message: 'Función actualizada exitosamente',
      data: updatedShowtime
    });
  } catch (error) {
    next(error);
  }
};

const deleteShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findByPk(id);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Verificar si hay reservas activas
    const activeBookings = await Booking.count({
      where: { 
        showtimeId: id,
        status: 'confirmed'
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la función porque tiene reservas activas'
      });
    }

    await showtime.destroy();

    res.json({
      success: true,
      message: 'Función eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime
};