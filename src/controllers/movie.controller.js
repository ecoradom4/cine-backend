const { Movie, Showtime, Branch } = require('../models');
const { Op } = require('sequelize');

const getAllMovies = async (req, res, next) => {
  try {
    const { genre, search, branchId, date } = req.query;
    
    const whereClause = {};
    const includeClause = [];
    
    // Filtro por género - BUSQUEDA EXACTA en el array de géneros
    if (genre && genre !== 'Todos') {
      whereClause.genre = {
        [Op.like]: `%${genre}%`
      };
    }
    
    // Filtro por búsqueda en título o descripción
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro por sucursal
    if (branchId) {
      whereClause.branchId = branchId;
    }

    // Filtro por fecha de función - requiere join con showtimes
    if (date) {
      includeClause.push({
        model: Showtime,
        as: 'showtimes',
        where: {
          startsAt: {
            [Op.between]: [
              new Date(`${date}T00:00:00`),
              new Date(`${date}T23:59:59`)
            ]
          }
        },
        required: true // INNER JOIN para solo películas con funciones en esa fecha
      });
    } else {
      // Si no hay filtro de fecha, incluir showtimes pero no requerirlos
      includeClause.push({
        model: Showtime,
        as: 'showtimes',
        required: false
      });
    }

    // Siempre incluir la relación con branch
    includeClause.push({
      model: Branch,
      as: 'branch',
      attributes: ['id', 'name', 'location']
    });

    const movies = await Movie.findAll({
      where: whereClause,
      include: includeClause,
      order: [['releaseDate', 'DESC']],
      distinct: true // Importante para evitar duplicados con el JOIN de showtimes
    });

    res.json({
      success: true,
      data: movies
    });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'location']
        },
        {
          model: Showtime,
          as: 'showtimes',
          include: ['room']
        }
      ]
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const movieData = req.body;
    
    // Validar que branchId esté presente
    if (!movieData.branchId) {
      return res.status(400).json({
        success: false,
        message: 'branchId es requerido'
      });
    }

    const movie = await Movie.create(movieData);

    // Cargar la relación branch para la respuesta
    const movieWithBranch = await Movie.findByPk(movie.id, {
      include: [{
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'location']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Película creada exitosamente',
      data: movieWithBranch
    });
  } catch (error) {
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movieData = req.body;

    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    await movie.update(movieData);

    // Cargar la relación branch para la respuesta
    const updatedMovie = await Movie.findByPk(id, {
      include: [{
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'location']
      }]
    });

    res.json({
      success: true,
      message: 'Película actualizada exitosamente',
      data: updatedMovie
    });
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    await movie.destroy();

    res.json({
      success: true,
      message: 'Película eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};