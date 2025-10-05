require('dotenv').config();
const { sequelize } = require('../config/db');
const { Movie, Room, User, Showtime, Booking } = require('../models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a Neon PostgreSQL');

    // Sincronizar modelos - FORZAR creación de tablas
    console.log('🔄 Sincronizando modelos con la base de datos...');
    await sequelize.sync({ force: false }); // Usar { force: true } solo si quieres borrar datos existentes
    console.log('✅ Tablas sincronizadas correctamente');

    // Crear usuario admin por defecto
    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@cine.com' },
      defaults: {
        name: 'Administrador',
        passwordHash: 'admin123',
        role: 'admin'
      }
    });
    
    if (adminCreated) {
      console.log('✅ Usuario admin creado:', adminUser.email);
    } else {
      console.log('ℹ️ Usuario admin ya existía:', adminUser.email);
    }

    // Crear usuario cliente de ejemplo
    const [clientUser, clientCreated] = await User.findOrCreate({
      where: { email: 'cliente@ejemplo.com' },
      defaults: {
        name: 'Cliente Ejemplo',
        passwordHash: 'cliente123',
        role: 'cliente'
      }
    });
    
    if (clientCreated) {
      console.log('✅ Usuario cliente creado:', clientUser.email);
    } else {
      console.log('ℹ️ Usuario cliente ya existía:', clientUser.email);
    }

    // Películas de ejemplo
    const movies = [
      {
        title: "Avatar: El Camino del Agua",
        genre: "Ciencia Ficción",
        duration: 192,
        rating: 7.8,
        poster: "https://image.tmdb.org/t/p/w500/94xxm5701CzOdJdUEdIuwqZaowx.jpg",
        description: "Jake Sully y Ney'tiri han formado una familia y hacen todo lo posible por permanecer juntos. Sin embargo, deben abandonar su hogar y explorar las regiones de Pandora cuando una antigua amenaza reaparece.",
        price: 12.50,
        releaseDate: new Date('2022-12-16')
      },
      {
        title: "Spider-Man: No Way Home",
        genre: "Acción",
        duration: 148,
        rating: 8.2,
        poster: "https://image.tmdb.org/t/p/w500/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
        description: "Peter Parker desenmascarado ya no puede separar su vida normal de los enormes riesgos de ser un superhéroe. Cuando pide ayuda al Doctor Strange, los riesgos pasan a ser aún más peligrosos.",
        price: 11.00,
        releaseDate: new Date('2021-12-17')
      },
      {
        title: "Top Gun: Maverick",
        genre: "Acción",
        duration: 130,
        rating: 8.4,
        poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
        description: "Después de más de treinta años de servicio como uno de los mejores aviadores de la Armada, Pete Mitchell está en donde pertenece, empujando los límites como un valiente piloto de pruebas.",
        price: 10.50,
        releaseDate: new Date('2022-05-27')
      }
    ];

    for (const movieData of movies) {
      const [movie, created] = await Movie.findOrCreate({
        where: { title: movieData.title },
        defaults: movieData
      });
      
      if (created) {
        console.log(`✅ Película creada: ${movie.title}`);
      } else {
        console.log(`ℹ️ Película ya existía: ${movie.title}`);
      }
    }

    // Salas de ejemplo
    const rooms = [
      { name: "Sala 1", capacity: 120, type: "standard", location: "Planta Baja" },
      { name: "Sala 2", capacity: 80, type: "standard", location: "Planta Baja" },
      { name: "Sala 3", capacity: 60, type: "VIP", location: "Primer Piso" },
      { name: "Sala 4", capacity: 200, type: "IMAX", location: "Segundo Piso" }
    ];

    const createdRooms = [];
    for (const roomData of rooms) {
      const [room, created] = await Room.findOrCreate({
        where: { name: roomData.name },
        defaults: roomData
      });
      
      createdRooms.push(room);
      if (created) {
        console.log(`✅ Sala creada: ${room.name}`);
      } else {
        console.log(`ℹ️ Sala ya existía: ${room.name}`);
      }
    }

    // Obtener películas creadas para las funciones
    const allMovies = await Movie.findAll();
    
    // Funciones de ejemplo
    const showtimes = [
      {
        movieId: allMovies[0].id,
        roomId: createdRooms[0].id,
        startsAt: new Date('2024-01-20T18:00:00'),
        price: 12.50
      },
      {
        movieId: allMovies[1].id,
        roomId: createdRooms[1].id,
        startsAt: new Date('2024-01-20T20:30:00'),
        price: 11.00
      },
      {
        movieId: allMovies[2].id,
        roomId: createdRooms[2].id,
        startsAt: new Date('2024-01-20T19:00:00'),
        price: 15.00
      }
    ];

    for (const showtimeData of showtimes) {
      const room = await Room.findByPk(showtimeData.roomId);
      const movie = await Movie.findByPk(showtimeData.movieId);
      
      const [showtime, created] = await Showtime.findOrCreate({
        where: {
          movieId: showtimeData.movieId,
          roomId: showtimeData.roomId,
          startsAt: showtimeData.startsAt
        },
        defaults: {
          ...showtimeData,
          seatsAvailable: room.capacity
        }
      });
      
      if (created) {
        console.log(`✅ Función creada: ${movie.title} en ${room.name} a las ${showtimeData.startsAt}`);
      } else {
        console.log(`ℹ️ Función ya existía: ${movie.title} en ${room.name}`);
      }
    }

    console.log('\n🎉 Seed completado correctamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Admin:    admin@cine.com / admin123');
    console.log('   Cliente:  cliente@ejemplo.com / cliente123');
    console.log('\n🌐 Puedes probar la API en:');
    console.log('   http://localhost:3001/api-docs');
    
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedData();