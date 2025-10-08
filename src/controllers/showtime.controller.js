const { Showtime, Movie, Room, RoomType, Branch, Booking, ScheduleTemplate } = require('../models');
const { Op } = require('sequelize');

const getAllShowtimes = async (req, res, next) => {
  try {
    const { movieId, roomId, branchId, roomTypeId, date, status } = req.query;
    
    const where = {};
    
    if (movieId) where.movieId = movieId;
    if (roomId) where.roomId = roomId;
    if (branchId) where.branchId = branchId;
    if (roomTypeId) where.roomTypeId = roomTypeId;
    if (status) where.status = status;
    
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
        { model: Room, as: 'room' },
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
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
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' },
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
    
    // Verificar que la película, sala y tipo de sala existen
    const movie = await Movie.findByPk(showtimeData.movieId);
    const room = await Room.findByPk(showtimeData.roomId);
    const roomType = await RoomType.findByPk(showtimeData.roomTypeId);
    const branch = await Branch.findByPk(showtimeData.branchId);
    
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

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de sala no encontrado'
      });
    }

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    // Verificar que no haya conflicto de horarios en la misma sala
    const conflictingShowtime = await Showtime.findOne({
      where: {
        roomId: showtimeData.roomId,
        startsAt: {
          [Op.between]: [
            new Date(new Date(showtimeData.startsAt).getTime() - 30 * 60000),
            new Date(new Date(showtimeData.startsAt).getTime() + movie.duration * 60000 + 30 * 60000)
          ]
        },
        status: { [Op.in]: ['scheduled', 'active'] }
      }
    });

    if (conflictingShowtime) {
      return res.status(400).json({
        success: false,
        message: 'Conflicto de horario con otra función en la misma sala'
      });
    }

    const showtime = await Showtime.create({
      ...showtimeData,
      seatsAvailable: room.capacity,
      status: 'scheduled'
    });

    const showtimeWithDetails = await Showtime.findByPk(showtime.id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' },
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
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

    const showtime = await Showtime.findByPk(id, {
      include: ['movie']
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Verificar si hay reservas confirmadas
    const confirmedBookings = await Booking.count({
      where: { 
        showtimeId: id,
        status: 'confirmed'
      }
    });

    if (confirmedBookings > 0 && (showtimeData.startsAt || showtimeData.roomId)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar una función con reservas confirmadas. Use la función de ajuste.'
      });
    }

    await showtime.update(showtimeData);

    const updatedShowtime = await Showtime.findByPk(id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' },
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
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
        status: { [Op.in]: ['confirmed', 'pending'] }
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

const createBatchShowtimes = async (req, res, next) => {
  try {
    const { templateId } = req.body;

    const template = await ScheduleTemplate.findByPk(templateId, {
      include: ['movie', 'room', 'branch']
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    const createdShowtimes = [];
    const batchId = `BATCH-${Date.now()}`;

    // Generar fechas en el rango
    const currentDate = new Date(template.startDate);
    const endDate = new Date(template.endDate);

    while (currentDate <= endDate) {
      // Verificar si es un día de la semana configurado
      if (template.daysOfWeek.includes(currentDate.getDay())) {
        for (const time of template.showtimes) {
          const [hours, minutes] = time.split(':');
          const startsAt = new Date(currentDate);
          startsAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Verificar que no exista ya una función a la misma hora en la misma sala
          const existingShowtime = await Showtime.findOne({
            where: {
              roomId: template.roomId,
              startsAt: {
                [Op.between]: [
                  new Date(startsAt.getTime() - 30 * 60000),
                  new Date(startsAt.getTime() + template.movie.duration * 60000 + 30 * 60000)
                ]
              },
              status: { [Op.in]: ['scheduled', 'active'] }
            }
          });

          if (!existingShowtime && startsAt > new Date()) {
            const showtime = await Showtime.create({
              movieId: template.movieId,
              roomId: template.roomId,
              branchId: template.branchId,
              roomTypeId: template.room.roomTypeId,
              startsAt,
              audioType: template.audioType,
              seatsAvailable: template.room.capacity,
              batchId,
              status: 'scheduled'
            });

            const showtimeWithDetails = await Showtime.findByPk(showtime.id, {
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' },
                { model: RoomType, as: 'roomType' }
              ]
            });

            createdShowtimes.push(showtimeWithDetails);
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(201).json({
      success: true,
      message: `${createdShowtimes.length} funciones creadas exitosamente`,
      data: {
        batchId,
        showtimes: createdShowtimes
      }
    });
  } catch (error) {
    next(error);
  }
};

const adjustShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStartsAt, newRoomId } = req.body;

    const originalShowtime = await Showtime.findByPk(id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' },
        { model: Booking, as: 'bookings' }
      ]
    });

    if (!originalShowtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Verificar que no haya reservas confirmadas
    const confirmedBookings = originalShowtime.bookings.filter(
      booking => booking.status === 'confirmed'
    );

    if (confirmedBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede ajustar una función con reservas confirmadas'
      });
    }

    // Crear nueva función ajustada
    const adjustedShowtime = await Showtime.create({
      ...originalShowtime.toJSON(),
      id: undefined,
      startsAt: newStartsAt || originalShowtime.startsAt,
      roomId: newRoomId || originalShowtime.roomId,
      originalShowtimeId: originalShowtime.id,
      status: 'scheduled'
    });

    // Cancelar la función original
    await originalShowtime.update({ status: 'cancelled' });

    // Transferir reservas pendientes
    await Booking.update(
      { showtimeId: adjustedShowtime.id },
      { 
        where: { 
          showtimeId: originalShowtime.id,
          status: 'pending'
        }
      }
    );

    const adjustedWithDetails = await Showtime.findByPk(adjustedShowtime.id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Room, as: 'room' },
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
      ]
    });

    res.json({
      success: true,
      message: 'Función ajustada exitosamente',
      data: adjustedWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const getShowtimeSeatMap = async (req, res, next) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findByPk(id, {
      include: [
        { model: Room, as: 'room' },
        { model: Movie, as: 'movie' },
        { model: RoomType, as: 'roomType' }
      ]
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Obtener asientos ocupados y reservados
    const occupiedSeats = await getOccupiedSeats(id);

    res.json({
      success: true,
      data: {
        showtime: {
          id: showtime.id,
          startsAt: showtime.startsAt,
          movie: showtime.movie,
          roomType: showtime.roomType
        },
        room: showtime.room,
        seatMap: showtime.room.seatMap,
        occupiedSeats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Función auxiliar para obtener asientos ocupados
async function getOccupiedSeats(showtimeId) {
  const occupiedSeats = {};

  // Asientos de bookings confirmados
  const confirmedBookings = await Booking.findAll({
    where: {
      showtimeId,
      status: 'confirmed'
    }
  });

  confirmedBookings.forEach(booking => {
    booking.seats.forEach(seat => {
      occupiedSeats[seat] = 'occupied';
    });
  });

  // Asientos de reservas temporales activas
  const activeReservations = await SeatReservation.findAll({
    where: {
      showtimeId,
      status: 'reserved',
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  activeReservations.forEach(reservation => {
    reservation.seats.forEach(seat => {
      if (!occupiedSeats[seat]) {
        occupiedSeats[seat] = 'reserved';
      }
    });
  });

  return occupiedSeats;
}

module.exports = {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  createBatchShowtimes,
  adjustShowtime,
  getShowtimeSeatMap
};