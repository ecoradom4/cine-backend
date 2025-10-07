require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Movie, Room, Showtime, Booking, Branch, SeatReservation } = require('../models');

const resetAndSeed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // FORZAR recreación de todas las tablas (¡CUIDADO! Esto borra todos los datos)
    console.log('🔄 Recreando todas las tablas...');
    await sequelize.sync({ force: true });
    console.log('✅ Todas las tablas recreadas');

    // Crear sucursales
    console.log('🏢 Creando sucursales...');
    const branches = await Branch.bulkCreate([
      {
        name: 'Cine Telares',
        address: 'Carretera a Ciudad Vieja Km. 8.5',
        city: 'Antigua Guatemala',
        phone: '8567 8900',
        openingHours: '10:00 - 23:00'
      },
      {
        name: 'Cine Centro',
        address: '6a Avenida 8-00, Zona 4',
        city: 'Guatemala City',
        phone: '2234 5678',
        openingHours: '09:00 - 24:00'
      }
    ]);
    console.log('✅ Sucursales creadas');

    // Crear usuarios
    console.log('👤 Creando usuarios...');
    const users = await User.bulkCreate([
      {
        name: 'Administrador',
        email: 'admin@cine.com',
        passwordHash: 'admin123',
        role: 'admin'
      },
      {
        name: 'Cliente Ejemplo',
        email: 'cliente@ejemplo.com',
        passwordHash: 'cliente123',
        role: 'cliente'
      }
    ]);
    console.log('✅ Usuarios creados');

    // Crear salas con seatMap
    console.log('🎬 Creando salas...');
    const rooms = await Room.bulkCreate([
      {
        name: 'Sala 1 - Premium',
        capacity: 120,
        type: 'premium',
        location: 'Planta Baja',
        rows: 10,
        seatsPerRow: 12,
        branchId: branches[0].id,
        seatMap: generateSeatMap(10, 12, 'premium')
      },
      {
        name: 'Sala 2 - IMAX',
        capacity: 200,
        type: 'imax',
        location: 'Segundo Piso',
        rows: 12,
        seatsPerRow: 18,
        branchId: branches[0].id,
        seatMap: generateSeatMap(12, 18, 'imax')
      },
      {
        name: 'Sala 3 - Standard',
        capacity: 80,
        type: 'standard',
        location: 'Primer Piso',
        rows: 8,
        seatsPerRow: 10,
        branchId: branches[1].id,
        seatMap: generateSeatMap(8, 10, 'standard')
      }
    ]);
    console.log('✅ Salas creadas');

    // Crear películas
    console.log('🎞️ Creando películas...');
    const movies = await Movie.bulkCreate([
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
    ]);
    console.log('✅ Películas creadas');

    // Crear funciones
    console.log('🕐 Creando funciones...');
    const showtimes = await Showtime.bulkCreate([
      {
        movieId: movies[0].id,
        roomId: rooms[0].id,
        branchId: branches[0].id,
        startsAt: new Date('2024-01-20T18:00:00'),
        price: 12.50,
        seatsAvailable: 120,
        occupiedSeats: {}
      },
      {
        movieId: movies[1].id,
        roomId: rooms[1].id,
        branchId: branches[0].id,
        startsAt: new Date('2024-01-20T20:30:00'),
        price: 11.00,
        seatsAvailable: 200,
        occupiedSeats: {}
      },
      {
        movieId: movies[2].id,
        roomId: rooms[2].id,
        branchId: branches[1].id,
        startsAt: new Date('2024-01-20T19:00:00'),
        price: 10.50,
        seatsAvailable: 80,
        occupiedSeats: {}
      }
    ]);
    console.log('✅ Funciones creadas');

    console.log('\n🎉 Base de datos resetada y poblada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Admin:    admin@cine.com / admin123');
    console.log('   Cliente:  cliente@ejemplo.com / cliente123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

function generateSeatMap(rows, seatsPerRow, roomType = 'standard') {
  const seatMap = {};
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const basePrice = roomType === 'premium' ? 15 : roomType === 'imax' ? 18 : 10;
  
  for (let i = 0; i < rows; i++) {
    const row = rowLetters[i];
    seatMap[row] = {};
    
    for (let j = 1; j <= seatsPerRow; j++) {
      const isVip = (i < 2) || Math.random() < 0.1; // Primeras 2 filas VIP + 10% aleatorio
      const seatPrice = isVip ? basePrice + 5 : basePrice;
      
      seatMap[row][j] = {
        status: 'available',
        type: isVip ? 'vip' : 'regular',
        price: seatPrice
      };
    }
  }
  
  return seatMap;
}

resetAndSeed();