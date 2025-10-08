const { Movie, Showtime, Branch, Room, RoomType } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios'); 

const OMDB_API_KEY = process.env.OMDB_API_KEY || '530bb677'; // Usa variables de entorno
const OMDB_BASE_URL = 'http://www.omdbapi.com/';


/**
 * Función para buscar película en OMDb y obtener el póster
 */
const searchMoviePoster = async (movieTitle, year = null) => {
  try {
    console.log(`🎬 Buscando póster para: "${movieTitle}"${year ? ` (${year})` : ''}`);
    
    const params = {
      apikey: OMDB_API_KEY,
      t: movieTitle,
      type: 'movie'
    };
    
    // Si tenemos año, lo añadimos para mayor precisión
    if (year) {
      params.y = year;
    }

    const response = await axios.get(OMDB_BASE_URL, { params });
    const data = response.data;

    console.log('📡 Respuesta de OMDb:', {
      títuloBuscado: movieTitle,
      títuloEncontrado: data.Title,
      año: data.Year,
      tienePóster: !!data.Poster,
      respuesta: data.Response
    });

    // Verificar si la película fue encontrada y tiene póster
    if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
      return {
        posterUrl: data.Poster,
        title: data.Title,
        year: data.Year,
        plot: data.Plot,
        director: data.Director,
        actors: data.Actors,
        imdbRating: data.imdbRating
      };
    } else {
      console.warn('⚠️ No se encontró póster en OMDb:', data.Error || 'Película no encontrada');
      return null;
    }
  } catch (error) {
    console.error('❌ Error al buscar en OMDb:', error.message);
    return null;
  }
};

const getAllMovies = async (req, res, next) => {
  try {
    const { genre, search, branchId, date, status } = req.query;
    
    console.log("📥 Filtros recibidos en backend:", { genre, search, branchId, date, status });
    
    const whereClause = {};
    
    // Filtro por género
    if (genre && genre !== 'Todos' && genre !== 'all-genres') {
      whereClause.genre = {
        [Op.iLike]: `%${genre}%`
      };
    }
    
    // Filtro por búsqueda en título o descripción
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por status
    if (status) {
      whereClause.status = status;
    }

    // Construir include para showtimes con filtros
    const showtimeInclude = {
      model: Showtime,
      as: 'showtimes',
      where: {
        startsAt: { [Op.gte]: new Date() }, // Solo funciones futuras
        status: { [Op.in]: ['scheduled', 'active'] } // Solo funciones activas
      },
      required: false, // LEFT JOIN para incluir películas sin funciones
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        },
        {
          model: RoomType,
          as: 'roomType',
          attributes: ['id', 'name', 'basePrice']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'city']
        }
      ]
    };

    // Aplicar filtros adicionales a showtimes
    if (date) {
      showtimeInclude.where.startsAt = {
        ...showtimeInclude.where.startsAt,
        [Op.between]: [
          new Date(`${date}T00:00:00`),
          new Date(`${date}T23:59:59`)
        ]
      };
    }

    if (branchId && branchId !== 'Todas las sucursales') {
      showtimeInclude.where.branchId = branchId;
    }

    console.log("🔍 Consulta Sequelize:", {
      where: whereClause,
      include: showtimeInclude
    });

    const movies = await Movie.findAll({
      where: whereClause,
      include: [showtimeInclude],
      order: [['releaseDate', 'DESC']],
      distinct: true
    });

    // Filtrar películas que no tienen funciones según los filtros aplicados
    const filteredMovies = movies.filter(movie => {
      if ((date || branchId) && movie.showtimes.length === 0) {
        return false;
      }
      return true;
    });

    console.log("✅ Películas encontradas después de filtrar:", filteredMovies.length);

    res.json({
      success: true,
      data: { movies: filteredMovies }
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
          where: {
            startsAt: { [Op.gte]: new Date() }
          },
          required: false,
          include: [
            {
              model: Room,
              as: 'room',
              attributes: ['id', 'name', 'capacity', 'seatMap']
            },
            {
              model: RoomType,
              as: 'roomType',
              attributes: ['id', 'name', 'basePrice']
            },
            {
              model: Branch,
              as: 'branch',
              attributes: ['id', 'name', 'city', 'address']
            }
          ],
          order: [['startsAt', 'ASC']]
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
      data: { movie }
    });
  } catch (error) {
    next(error);
  }
};


const createMovie = async (req, res, next) => {
  try {
    const movieData = req.body;
    
    console.log('🎬 Datos recibidos para crear película:', movieData);

    // Validar datos requeridos
    if (!movieData.title || !movieData.genre || !movieData.duration) {
      return res.status(400).json({
        success: false,
        message: 'Título, género y duración son requeridos'
      });
    }

    // Buscar póster automáticamente si no se proporcionó uno
    if (!movieData.poster) {
      console.log('🖼️ No se proporcionó póster, buscando automáticamente...');
      
      const omdbData = await searchMoviePoster(
        movieData.title, 
        movieData.releaseDate ? new Date(movieData.releaseDate).getFullYear() : null
      );
      
      if (omdbData && omdbData.posterUrl) {
        movieData.poster = omdbData.posterUrl;
        console.log('✅ Póster encontrado y asignado:', omdbData.posterUrl);
        
        // Opcional: Puedes enriquecer los datos con la información de OMDb
        if (!movieData.description && omdbData.plot) {
          movieData.description = omdbData.plot;
        }
        
        // Si quieres guardar más datos de OMDb, podrías agregar campos a tu modelo
        // movieData.omdbData = omdbData;
      } else {
        console.log('⚠️ No se pudo encontrar póster automáticamente');
        // Puedes asignar un póster por defecto o dejar null
        movieData.poster = null; // o una URL de póster por defecto
      }
    } else {
      console.log('✅ Se proporcionó póster manualmente:', movieData.poster);
    }

    // Crear la película
    const movie = await Movie.create(movieData);

    // Obtener la película con sus relaciones
    const movieWithDetails = await Movie.findByPk(movie.id, {
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          include: ['room', 'roomType', 'branch']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Película creada exitosamente',
      data: { movie: movieWithDetails }
    });
  } catch (error) {
    console.error("❌ Error en createMovie:", error);
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

    const updatedMovie = await Movie.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          include: ['room', 'roomType', 'branch']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Película actualizada exitosamente',
      data: { movie: updatedMovie }
    });
  } catch (error) {
    console.error("❌ Error en updateMovie:", error);
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          include: ['bookings']
        }
      ]
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    // Verificar si tiene funciones con reservas activas
    const hasActiveBookings = movie.showtimes.some(showtime => 
      showtime.bookings && showtime.bookings.length > 0
    );

    if (hasActiveBookings) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la película porque tiene funciones con reservas activas'
      });
    }

    await movie.destroy();

    res.json({
      success: true,
      message: 'Película eliminada exitosamente'
    });
  } catch (error) {
    console.error("❌ Error en deleteMovie:", error);
    next(error);
  }
};

const getMovieShowtimes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branchId, date } = req.query;

    const where = {
      movieId: id,
      startsAt: { [Op.gte]: new Date() },
      status: { [Op.in]: ['scheduled', 'active'] }
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (date) {
      where.startsAt = {
        ...where.startsAt,
        [Op.between]: [
          new Date(`${date}T00:00:00`),
          new Date(`${date}T23:59:59`)
        ]
      };
    }

    const showtimes = await Showtime.findAll({
      where,
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        },
        {
          model: RoomType,
          as: 'roomType',
          attributes: ['id', 'name', 'basePrice']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'city', 'address']
        }
      ],
      order: [['startsAt', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        showtimes: showtimes.map(showtime => ({
          ...showtime.toJSON(),
          availableSeats: showtime.seatsAvailable,
          formattedTime: new Date(showtime.startsAt).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          formattedDate: new Date(showtime.startsAt).toLocaleDateString('es-ES')
        }))
      }
    });
  } catch (error) {
    console.error("❌ Error en getMovieShowtimes:", error);
    next(error);
  }
};

const updateMoviePoster = async (req, res, next) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    console.log(`🔄 Actualizando póster para: "${movie.title}"`);

    // Buscar nuevo póster
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
    const omdbData = await searchMoviePoster(movie.title, year);
    
    if (omdbData && omdbData.posterUrl) {
      const oldPoster = movie.poster;
      await movie.update({ poster: omdbData.posterUrl });
      
      console.log('✅ Póster actualizado exitosamente:', {
        viejo: oldPoster,
        nuevo: omdbData.posterUrl
      });
      
      res.json({
        success: true,
        message: 'Póster actualizado exitosamente',
        data: {
          oldPoster: oldPoster,
          newPoster: omdbData.posterUrl,
          movie: await Movie.findByPk(id)
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No se pudo encontrar un póster para esta película'
      });
    }
  } catch (error) {
    console.error("❌ Error en updateMoviePoster:", error);
    next(error);
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieShowtimes,
  searchMoviePoster,
  updateMoviePoster
};