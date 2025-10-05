const { Booking, Showtime, Movie, Room } = require('../models');

const createBooking = async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;
    const userId = req.user.id;

    // Verificar que la función existe
    const showtime = await Showtime.findByPk(showtimeId, {
      include: ['movie', 'room']
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Verificar disponibilidad de asientos
    if (seats.length > showtime.seatsAvailable) {
      return res.status(400).json({
        success: false,
        message: 'No hay suficientes asientos disponibles'
      });
    }

    // Calcular precio total
    const totalPrice = seats.length * showtime.price;

    // Crear reserva
    const booking = await Booking.create({
      userId,
      showtimeId,
      seats,
      totalPrice,
      status: 'confirmed'
    });

    // Actualizar asientos disponibles
    await showtime.update({
      seatsAvailable: showtime.seatsAvailable - seats.length
    });

    // Obtener reserva con datos relacionados
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [{
        model: Showtime,
        as: 'showtime',
        include: ['movie', 'room']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: bookingWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.findAll({
      where: { userId },
      include: [{
        model: Showtime,
        as: 'showtime',
        include: ['movie', 'room']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, userId },
      include: [{
        model: Showtime,
        as: 'showtime',
        include: ['movie', 'room']
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, userId },
      include: ['showtime']
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'La reserva ya está cancelada'
      });
    }

    // Liberar asientos
    await booking.showtime.update({
      seatsAvailable: booking.showtime.seatsAvailable + booking.seats.length
    });

    // Cancelar reserva
    await booking.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking
};