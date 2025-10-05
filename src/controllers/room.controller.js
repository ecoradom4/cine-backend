const { Room, Showtime } = require('../models');

const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.findAll({
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
      include: [{
        model: Showtime,
        as: 'showtimes',
        include: ['movie']
      }]
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
    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: 'Sala creada exitosamente',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roomData = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    await room.update(roomData);

    res.json({
      success: true,
      message: 'Sala actualizada exitosamente',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
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

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};