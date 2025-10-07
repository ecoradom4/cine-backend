// controllers/cartelera.controller.js 
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
        [Op.gte]: new Date()
      },
      seatsAvailable: {
        [Op.gt]: 0
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

    // Construir where para películas - CORREGIDO
    const whereMovie = {};
    if (genero && genero !== 'Todos' && genero !== 'all-genres') {
      whereMovie.genre = {
        [Op.iLike]: `%${genero}%`
      };
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
          required: true,
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

    res.json({
      success: true,
      data: {
        movies,
        total: movies.length,
        filters: { fecha, genero, sucursalId, search }
      }
    });

  } catch (error) {
    console.error("❌ Error en getCartelera:", error);
    next(error);
  }
};