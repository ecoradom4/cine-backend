// controllers/cartelera.controller.js
const { Movie, Showtime, Branch, Room } = require('../models');
const { Op } = require('sequelize');

const getCartelera = async (req, res, next) => {
  try {
    const { fecha, genero, sucursalId, search } = req.query;
    
    console.log("🎬 Filtros cartelera recibidos:", { 
      fecha, 
      genero, 
      sucursalId, 
      search 
    });

    // Construir where para funciones (solo funciones futuras)
    const whereShowtime = {
      startsAt: {
        [Op.gte]: new Date() // Solo funciones futuras
      },
      seatsAvailable: {
        [Op.gt]: 0 // Solo funciones con asientos disponibles
      }
    };

    // Aplicar filtros específicos a funciones
    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(fecha);
      endDate.setDate(endDate.getDate() + 1);
      
      whereShowtime.startsAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (sucursalId && sucursalId !== 'Todas') {
      whereShowtime.branchId = sucursalId;
    }

    // Construir where para películas
    const whereMovie = {};
    if (genero && genero !== 'Todos') {
      whereMovie.genre = genero;
    }

    if (search) {
      whereMovie[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    console.log("🔍 Consultando cartelera con filtros:", {
      whereMovie,
      whereShowtime
    });

    const movies = await Movie.findAll({
      where: whereMovie,
      include: [
        {
          model: Showtime,
          as: 'showtimes',
          where: whereShowtime,
          required: true, // CRÍTICO: Solo películas con funciones que cumplan los filtros
          include: [
            {
              model: Room,
              as: 'room',
              attributes: ['id', 'name', 'capacity']
            },
            {
              model: Branch,
              as: 'branch',
              attributes: ['id', 'name', 'city']
            }
          ]
        }
      ],
      order: [
        ['releaseDate', 'DESC'],
        [{ model: Showtime, as: 'showtimes' }, 'startsAt', 'ASC']
      ]
    });

    console.log(`✅ Cartelera: ${movies.length} películas con funciones disponibles`);

    // Transformar datos para frontend
    const carteleraData = movies.map(movie => {
      const movieData = movie.toJSON();
      
      return {
        ...movieData,
        showtimes: movieData.showtimes.map(showtime => ({
          id: showtime.id,
          startsAt: showtime.startsAt,
          price: showtime.price,
          seatsAvailable: showtime.seatsAvailable,
          availableSeats: showtime.seatsAvailable,
          room: showtime.room,
          branch: showtime.branch,
          branchName: showtime.branch?.name,
          roomName: showtime.room?.name,
          formattedTime: new Date(showtime.startsAt).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          formattedDate: new Date(showtime.startsAt).toLocaleDateString('es-ES')
        }))
      };
    });

    res.json({
      success: true,
      data: {
        movies: carteleraData,
        total: carteleraData.length,
        filters: { fecha, genero, sucursalId, search }
      }
    });

  } catch (error) {
    console.error("❌ Error en getCartelera:", error);
    next(error);
  }
};

const getShowtimesByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { fecha, sucursalId } = req.query;

    console.log(`🎬 Obteniendo funciones para película ${movieId}`, { fecha, sucursalId });

    const where = {
      movieId,
      startsAt: { 
        [Op.gte]: new Date() // Solo funciones futuras
      },
      seatsAvailable: {
        [Op.gt]: 0 // Con asientos disponibles
      }
    };

    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(fecha);
      endDate.setDate(endDate.getDate() + 1);
      where.startsAt = { 
        [Op.between]: [startDate, endDate] 
      };
    }

    if (sucursalId) {
      where.branchId = sucursalId;
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
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'city']
        },
        {
          model: Movie,
          as: 'movie',
          attributes: ['id', 'title', 'duration', 'genre']
        }
      ],
      order: [['startsAt', 'ASC']]
    });

    console.log(`✅ Encontradas ${showtimes.length} funciones para la película`);

    res.json({
      success: true,
      data: showtimes.map(showtime => ({
        ...showtime.toJSON(),
        availableSeats: showtime.seatsAvailable,
        formattedTime: new Date(showtime.startsAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        formattedDate: new Date(showtime.startsAt).toLocaleDateString('es-ES')
      }))
    });
  } catch (error) {
    console.error("❌ Error en getShowtimesByMovie:", error);
    next(error);
  }
};

module.exports = {
  getCartelera,
  getShowtimesByMovie
};