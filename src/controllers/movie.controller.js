const { Movie, Showtime, Branch, Room } = require('../models');
const { Op } = require('sequelize');

const getAllMovies = async (req, res, next) => {
  try {
    const { genre, search, branchId, date } = req.query;
    
    console.log("📥 Filtros recibidos en backend:", { genre, search, branchId, date });
    
    const whereClause = {};
    const includeClause = [];
    
    // Filtro por género
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

    // Filtro por fecha de función - a través de showtimes
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
        required: false // Cambiar a false para no forzar la relación
      });
    }

    // Filtro por sucursal - a través de showtimes
    if (branchId && branchId !== 'Todas las sucursales') {
      includeClause.push({
        model: Showtime,
        as: 'showtimes',
        where: {
          branchId: branchId
        },
        required: false // Cambiar a false
      });
    }

    console.log("🔍 Consulta Sequelize:", {
      where: whereClause,
      include: includeClause
    });

    const movies = await Movie.findAll({
      where: whereClause,
      include: includeClause,
      order: [['releaseDate', 'DESC']],
      distinct: true
    });

    console.log("✅ Películas encontradas:", movies.length);

    res.json({
      success: true,
      data: { movies } // ← IMPORTANTE: Envolver en data según tu frontend
    });
  } catch (error) {
    console.error("❌ Error en getAllMovies:", error);
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          include: [
            {
              model: Room,
              as: 'room'
            },
            {
              model: Branch,
              as: 'branch'
            }
          ]
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
      data: { movie } // ← Envolver en data
    });
  } catch (error) {
    next(error);
  }
};

// ELIMINAR branchId de createMovie y updateMovie
const createMovie = async (req, res, next) => {
  try {
    const movieData = req.body;
    
    // REMOVER validación de branchId - Movie no tiene branchId
    // if (!movieData.branchId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'branchId es requerido'
    //   });
    // }

    const movie = await Movie.create(movieData);

    res.status(201).json({
      success: true,
      message: 'Película creada exitosamente',
      data: { movie } // ← Envolver en data
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

    res.json({
      success: true,
      message: 'Película actualizada exitosamente',
      data: { movie } // ← Envolver en data
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