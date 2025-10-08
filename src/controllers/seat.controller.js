const { Showtime, SeatReservation, Booking, Room, Movie } = require('../models');
const { Op } = require('sequelize'); 

// Obtener mapa de asientos de una función
const getShowtimeSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findByPk(id, {
      include: [
        {
          model: Room, 
          as: 'room'
        },
        {
          model: Movie, 
          as: 'movie'
        }
      ]
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Obtener reservas temporales activas
    const activeReservations = await SeatReservation.findAll({
      where: {
        showtimeId: id,
        status: 'reserved',
        expiresAt: { [Op.gt]: new Date() } // Necesitas Op
      }
    });

    // Obtener bookings confirmados para esta función
    const confirmedBookings = await Booking.findAll({
      where: {
        showtimeId: id,
        status: 'confirmed'
      }
    });

    // Combinar asientos ocupados de bookings confirmados y reservas temporales
    const occupiedFromBookings = {};
    confirmedBookings.forEach(booking => {
      booking.seats.forEach(seat => {
        occupiedFromBookings[seat] = 'occupied';
      });
    });

    const occupiedFromReservations = {};
    activeReservations.forEach(reservation => {
      reservation.seats.forEach(seat => {
        occupiedFromReservations[seat] = 'reserved';
      });
    });

    const combinedOccupiedSeats = {
      ...occupiedFromBookings,
      ...occupiedFromReservations
    };

    res.json({
      success: true,
      data: {
        showtime: {
          id: showtime.id,
          startsAt: showtime.startsAt,
          price: showtime.price,
          movie: showtime.movie
        },
        room: showtime.room,
        seatMap: showtime.room.seatMap,
        occupiedSeats: combinedOccupiedSeats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reservar asientos temporalmente
const reserveSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { seats, sessionId } = req.body;
    const userId = req.user.id;

    const showtime = await Showtime.findByPk(id, {
      include: [{
        model: Room,
        as: 'room'
      }]
    });
    
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Verificar que los asientos estén disponibles
    const seatMap = showtime.room.seatMap;
    
    // Obtener estado actual de asientos
    const seatData = await getShowtimeSeatsData(id);
    
    for (const seat of seats) {
      const [row, number] = [seat[0], parseInt(seat.slice(1))];
      
      if (!seatMap[row] || !seatMap[row][number]) {
        return res.status(400).json({
          success: false,
          message: `Asiento ${seat} no existe`
        });
      }

      if (seatData.occupiedSeats[seat]) {
        return res.status(400).json({
          success: false,
          message: `Asiento ${seat} no está disponible`
        });
      }
    }

    // Liberar reservas previas de esta sesión
    await SeatReservation.destroy({
      where: {
        showtimeId: id,
        sessionId: sessionId || userId
      }
    });

    // Crear nueva reserva temporal (15 minutos)
    const reservation = await SeatReservation.create({
      showtimeId: id,
      userId: userId,
      seats: seats,
      sessionId: sessionId || userId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
    });

    res.json({
      success: true,
      message: 'Asientos reservados temporalmente',
      data: {
        reservationId: reservation.id,
        seats: seats,
        expiresAt: reservation.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Liberar asientos reservados
const releaseSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reservationId, sessionId } = req.body;
    const userId = req.user.id;

    const whereClause = { showtimeId: id };
    
    if (reservationId) {
      whereClause.id = reservationId;
    } else {
      whereClause.sessionId = sessionId || userId;
    }

    await SeatReservation.destroy({ where: whereClause });

    res.json({
      success: true,
      message: 'Asientos liberados'
    });
  } catch (error) {
    next(error);
  }
};

// Función auxiliar para obtener datos de asientos
async function getShowtimeSeatsData(showtimeId) {
  const showtime = await Showtime.findByPk(showtimeId, {
    include: [{
      model: Room,
      as: 'room'
    }]
  });

  const activeReservations = await SeatReservation.findAll({
    where: {
      showtimeId: showtimeId,
      status: 'reserved',
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  const confirmedBookings = await Booking.findAll({
    where: {
      showtimeId: showtimeId,
      status: 'confirmed'
    }
  });

  const occupiedFromBookings = {};
  confirmedBookings.forEach(booking => {
    booking.seats.forEach(seat => {
      occupiedFromBookings[seat] = 'occupied';
    });
  });

  const occupiedFromReservations = {};
  activeReservations.forEach(reservation => {
    reservation.seats.forEach(seat => {
      occupiedFromReservations[seat] = 'reserved';
    });
  });

  return {
    seatMap: showtime.room.seatMap,
    occupiedSeats: {
      ...occupiedFromBookings,
      ...occupiedFromReservations
    }
  };
}

module.exports = {
  getShowtimeSeats,
  reserveSeats,
  releaseSeats
};