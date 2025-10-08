const { ScheduleTemplate, Movie, Room, Branch, Showtime } = require('../models');
const { Op } = require('sequelize');

const getAllTemplates = async (req, res, next) => {
  try {
    const { status, branchId, movieId } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (movieId) {
      where.movieId = movieId;
    }

    const templates = await ScheduleTemplate.findAll({
      where,
      include: [
        { 
          model: Movie, 
          as: 'movie',
          attributes: ['id', 'title', 'duration', 'genre']
        },
        { 
          model: Room, 
          as: 'room',
          attributes: ['id', 'name', 'capacity', 'roomTypeId']
        },
        { 
          model: Branch, 
          as: 'branch',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await ScheduleTemplate.findByPk(id, {
      include: [
        { 
          model: Movie, 
          as: 'movie',
          attributes: ['id', 'title', 'duration', 'genre', 'poster']
        },
        { 
          model: Room, 
          as: 'room',
          attributes: ['id', 'name', 'capacity', 'roomTypeId']
        },
        { 
          model: Branch, 
          as: 'branch',
          attributes: ['id', 'name', 'location']
        },
        {
          model: Showtime,
          as: 'generatedShowtimes',
          attributes: ['id', 'startsAt', 'status', 'seatsAvailable'],
          where: {
            startsAt: { [Op.gte]: new Date() }
          },
          required: false,
          order: [['startsAt', 'ASC']]
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const templateData = req.body;

    // Validar datos requeridos
    const requiredFields = ['name', 'startDate', 'endDate', 'daysOfWeek', 'showtimes', 'movieId', 'roomId', 'branchId'];
    const missingFields = requiredFields.filter(field => !templateData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
      });
    }

    // Validar que startDate sea anterior a endDate
    if (new Date(templateData.startDate) >= new Date(templateData.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    // Validar días de la semana
    if (!Array.isArray(templateData.daysOfWeek) || templateData.daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos un día de la semana'
      });
    }

    // Validar horarios
    if (!Array.isArray(templateData.showtimes) || templateData.showtimes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos un horario'
      });
    }

    // Verificar que la sala exista
    const room = await Room.findByPk(templateData.roomId, {
      include: [{ model: Branch, as: 'branch' }]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    // Verificar que la película exista
    const movie = await Movie.findByPk(templateData.movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    // Verificar que no haya conflictos con otras plantillas en la misma sala
    const conflictingTemplate = await ScheduleTemplate.findOne({
      where: {
        roomId: templateData.roomId,
        status: 'active',
        [Op.or]: [
          {
            startDate: { [Op.lte]: templateData.endDate },
            endDate: { [Op.gte]: templateData.startDate }
          }
        ]
      }
    });

    if (conflictingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una plantilla activa para esta sala en el rango de fechas especificado'
      });
    }

    const template = await ScheduleTemplate.create({
      ...templateData,
      status: 'active'
    });

    const templateWithDetails = await ScheduleTemplate.findByPk(template.id, {
      include: [
        { 
          model: Movie, 
          as: 'movie',
          attributes: ['id', 'title', 'duration', 'genre']
        },
        { 
          model: Room, 
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        },
        { 
          model: Branch, 
          as: 'branch',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Plantilla creada exitosamente',
      data: templateWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const templateData = req.body;

    const template = await ScheduleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    // Validar que startDate sea anterior a endDate si se están actualizando
    if (templateData.startDate && templateData.endDate) {
      if (new Date(templateData.startDate) >= new Date(templateData.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
      }
    }

    // Si se cambia la sala, verificar conflictos
    if (templateData.roomId && templateData.roomId !== template.roomId) {
      const conflictingTemplate = await ScheduleTemplate.findOne({
        where: {
          id: { [Op.ne]: id },
          roomId: templateData.roomId,
          status: 'active',
          [Op.or]: [
            {
              startDate: { [Op.lte]: templateData.endDate || template.endDate },
              endDate: { [Op.gte]: templateData.startDate || template.startDate }
            }
          ]
        }
      });

      if (conflictingTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una plantilla activa para esta sala en el rango de fechas especificado'
        });
      }
    }

    await template.update(templateData);

    const updatedTemplate = await ScheduleTemplate.findByPk(id, {
      include: [
        { 
          model: Movie, 
          as: 'movie',
          attributes: ['id', 'title', 'duration', 'genre']
        },
        { 
          model: Room, 
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        },
        { 
          model: Branch, 
          as: 'branch',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Plantilla actualizada exitosamente',
      data: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await ScheduleTemplate.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: 'generatedShowtimes',
          where: {
            status: { [Op.in]: ['scheduled', 'active'] },
            startsAt: { [Op.gte]: new Date() }
          },
          required: false
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    // Verificar si hay funciones futuras generadas por esta plantilla
    if (template.generatedShowtimes && template.generatedShowtimes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la plantilla porque tiene funciones futuras programadas. Cancele las funciones primero.'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: 'Plantilla eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};