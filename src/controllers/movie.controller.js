const { Movie, Showtime } = require('../models');

const getAllMovies = async (req, res, next) => {
  try {
    const movies = await Movie.findAll({
      order: [['releaseDate', 'DESC']]
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
      include: [{
        model: Showtime,
        as: 'showtimes',
        include: ['room']
      }]
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
    const movie = await Movie.create(movieData);

    res.status(201).json({
      success: true,
      message: 'Película creada exitosamente',
      data: movie
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
      data: movie
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