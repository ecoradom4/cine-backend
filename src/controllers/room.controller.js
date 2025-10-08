const { Room, Showtime, RoomType, Branch, Booking } = require('../models');
const { Op } = require('sequelize');

const getAllRooms = async (req, res, next) => {
  try {
    const { branchId, status, roomTypeId } = req.query;
    
    const where = {};
    
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (roomTypeId) where.roomTypeId = roomTypeId;

    const rooms = await Room.findAll({
      where,
      include: [
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id, {
      include: [
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' },
        {
          model: Showtime,
          as: 'showtimes',
          include: [
            { model: Movie, as: 'movie' },
            { model: Booking, as: 'bookings' }
          ]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const roomData = req.body;
    
    // Validar que el roomType existe
    const roomType = await RoomType.findByPk(roomData.roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de sala no encontrado'
      });
    }

    // Validar que la branch existe
    const branch = await Branch.findByPk(roomData.branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    // Generar mapa de asientos por defecto si no se proporciona
    if (!roomData.seatMap || Object.keys(roomData.seatMap).length === 0) {
      roomData.seatMap = generateDefaultSeatMap(roomData.rows, roomData.seatsPerRow);
    }

    const room = await Room.create(roomData);

    const roomWithDetails = await Room.findByPk(room.id, {
      include: [
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Sala creada exitosamente',
      data: roomWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roomData = req.body;

    const room = await Room.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          where: {
            startsAt: { [Op.gte]: new Date() },
            status: { [Op.in]: ['scheduled', 'active'] }
          },
          required: false
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    // Verificar si tiene funciones futuras programadas
    if (room.showtimes && room.showtimes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar una sala con funciones futuras programadas'
      });
    }

    await room.update(roomData);

    const updatedRoom = await Room.findByPk(id, {
      include: [
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' }
      ]
    });

    res.json({
      success: true,
      message: 'Sala actualizada exitosamente',
      data: updatedRoom
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          where: {
            startsAt: { [Op.gte]: new Date() },
            status: { [Op.in]: ['scheduled', 'active'] }
          },
          required: false
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    // Verificar si tiene funciones futuras programadas
    if (room.showtimes && room.showtimes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una sala con funciones futuras programadas'
      });
    }

    await room.destroy();

    res.json({
      success: true,
      message: 'Sala eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const getRoomAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const room = await Room.findByPk(id, {
      include: [
        { model: RoomType, as: 'roomType' },
        { model: Branch, as: 'branch' },
        {
          model: Showtime,
          as: 'showtimes',
          where: date ? {
            startsAt: {
              [Op.between]: [
                new Date(`${date}T00:00:00`),
                new Date(`${date}T23:59:59`)
              ]
            }
          } : {},
          required: false,
          include: [
            { model: Movie, as: 'movie' },
            { model: Booking, as: 'bookings' }
          ]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    // Calcular disponibilidad por horario
    const timeSlots = generateTimeSlots();
    const availability = timeSlots.map(slot => {
      const conflictingShowtime = room.showtimes.find(showtime => {
        const showtimeStart = new Date(showtime.startsAt);
        const showtimeEnd = new Date(showtimeStart.getTime() + showtime.movie.duration * 60000);
        const slotStart = new Date(`${date}T${slot.start}:00`);
        const slotEnd = new Date(`${date}T${slot.end}:00`);

        return (slotStart >= showtimeStart && slotStart < showtimeEnd) ||
               (slotEnd > showtimeStart && slotEnd <= showtimeEnd) ||
               (slotStart <= showtimeStart && slotEnd >= showtimeEnd);
      });

      return {
        timeSlot: slot,
        available: !conflictingShowtime,
        conflictingShowtime: conflictingShowtime ? {
          movie: conflictingShowtime.movie.title,
          startsAt: conflictingShowtime.startsAt,
          duration: conflictingShowtime.movie.duration
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        room,
        availability,
        date: date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Función auxiliar para generar mapa de asientos por defecto
function generateDefaultSeatMap(rows, seatsPerRow) {
  const seatMap = {};
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  for (let i = 0; i < rows; i++) {
    const row = rowLetters[i];
    seatMap[row] = {};
    
    for (let j = 1; j <= seatsPerRow; j++) {
      // Asignar tipos de asiento: VIP las primeras 2 filas, standard el resto
      const type = i < 2 ? 'vip' : 'standard';
      seatMap[row][j] = { type, price: null }; // El precio se calculará dinámicamente
    }
  }

  return seatMap;
}

// Función auxiliar para generar slots de tiempo
function generateTimeSlots() {
  const slots = [];
  for (let hour = 9; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      slots.push({ start: startTime, end: endTime });
    }
  }
  return slots;
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomAvailability
};