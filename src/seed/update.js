// src/seed/update.js
require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Movie, Room, Showtime, Booking, Branch } = require('../models');
const bcrypt = require('bcryptjs');

// =========================
// FUNCIONES AUXILIARES
// =========================

// Generar mapa de asientos simplificado
function generateSeatMap(rows, seatsPerRow) {
  const seatMap = {};
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < rows; r++) {
    const rowLetter = letters[r];
    seatMap[rowLetter] = {};
    for (let s = 1; s <= seatsPerRow; s++) {
      seatMap[rowLetter][s] = "available";
    }
  }
  return seatMap;
}

// Seleccionar elementos aleatorios
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// =========================
// FUNCIÓN PRINCIPAL
// =========================

const resetAndSeed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    console.log('🔄 Sincronizando tablas...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas sincronizadas');

    // --- SUCURSALES ---
    console.log('🏢 Creando sucursales...');
    const branches = await Branch.bulkCreate([
      {
        name: 'Cine Connect Zona 4',
        address: '6a Avenida 8-00, Zona 4',
        city: 'Ciudad de Guatemala',
        phone: '+502 2234 5678',
        openingHours: 'Lunes a Domingo: 9:00 AM - 12:00 AM',
        status: 'active'
      },
      {
        name: 'Cine Connect Metronorte',
        address: 'Plaza Norte, Carretera al Atlántico Km 12.5',
        city: 'Ciudad de Guatemala',
        phone: '+502 2234 5679',
        openingHours: 'Lunes a Domingo: 10:00 AM - 11:00 PM',
        status: 'active'
      },
      {
        name: 'Cine Connect Miraflores',
        address: 'Centro Comercial Miraflores, Calzada Roosevelt',
        city: 'Ciudad de Guatemala',
        phone: '+502 2234 5680',
        openingHours: 'Lunes a Domingo: 9:30 AM - 11:30 PM',
        status: 'active'
      },
      {
        name: 'Cine Connect Antigua',
        address: '4a Calle Oriente #15, Antigua Guatemala',
        city: 'Antigua Guatemala',
        phone: '+502 7832 4567',
        openingHours: 'Lunes a Domingo: 10:00 AM - 10:00 PM',
        status: 'active'
      }
    ]);
    console.log('✅ Sucursales creadas');

    // --- USUARIOS ---
    console.log('👤 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('password', 10);
    const users = await User.bulkCreate([
      {
        name: 'Administrador Principal',
        email: 'admin@cineconnect.com',
        passwordHash: hashedPassword,
        role: 'admin'
      },
      {
        name: 'Juan Pérez',
        email: 'cliente@ejemplo.com',
        passwordHash: hashedPassword,
        role: 'cliente'
      },
      {
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        passwordHash: hashedPassword,
        role: 'cliente'
      },
      {
        name: 'Carlos López',
        email: 'carlos.lopez@email.com',
        passwordHash: hashedPassword,
        role: 'cliente'
      }
    ]);
    console.log('✅ Usuarios creados');

    // --- PELÍCULAS ---
    console.log('🎞️ Creando películas...');
    const movies = await Movie.bulkCreate([
      {
        title: "Avatar 3: The Seed Bearer",
        genre: "Ciencia Ficción, Aventura, Fantasía",
        duration: 180,
        rating: 8.5,
        poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400",
        description: "La continuación de la épica saga de Pandora.",
        price: 75.00,
        releaseDate: new Date('2025-12-19')
      },
      {
        title: "Avengers: Secret Wars",
        genre: "Acción, Aventura, Ciencia Ficción",
        duration: 160,
        rating: 8.8,
        poster: "https://images.unsplash.com/photo-1635863138275-d9b33299680a?w=400",
        description: "Los Vengadores se enfrentan a su mayor desafío.",
        price: 80.00,
        releaseDate: new Date('2025-05-02')
      },
      {
        title: "Zootopia 2",
        genre: "Animación, Comedia, Aventura, Familia",
        duration: 110,
        rating: 8.0,
        poster: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400",
        description: "Judy Hopps y Nick Wilde regresan en una nueva aventura.",
        price: 60.00,
        releaseDate: new Date('2025-11-26')
      },
      {
        title: "The Batman: Part II",
        genre: "Acción, Crimen, Drama",
        duration: 165,
        rating: 8.6,
        poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400",
        description: "Batman enfrenta nuevos y peligrosos villanos.",
        price: 72.00,
        releaseDate: new Date('2025-10-03')
      },
      {
        title: "Spider-Man: Beyond the Spider-Verse",
        genre: "Animación, Acción, Aventura",
        duration: 140,
        rating: 8.7,
        poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400",
        description: "Miles Morales continúa su viaje a través del multiverso.",
        price: 68.00,
        releaseDate: new Date('2025-03-15')
      },
      {
        title: "Frozen 3",
        genre: "Animación, Musical, Aventura, Familia",
        duration: 115,
        rating: 7.9,
        poster: "https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400",
        description: "Elsa y Anna regresan en una nueva aventura mágica.",
        price: 58.00,
        releaseDate: new Date('2025-11-10')
      },
      {
        title: "John Wick: Chapter 5",
        genre: "Acción, Crimen, Suspenso",
        duration: 155,
        rating: 8.3,
        poster: "https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=400",
        description: "John Wick continúa su lucha contra la Alta Mesa.",
        price: 70.00,
        releaseDate: new Date('2025-09-20')
      },
      {
        title: "Dune: Part Three",
        genre: "Ciencia Ficción, Aventura, Drama",
        duration: 190,
        rating: 8.9,
        poster: "https://images.unsplash.com/photo-1642618215095-3523a9a36893?w=400",
        description: "La conclusión de la épica adaptación de Dune.",
        price: 78.00,
        releaseDate: new Date('2025-12-15')
      }
    ]);
    console.log('✅ Películas creadas');

    // --- SALAS ---
    console.log('🎬 Creando salas...');
    const rooms = [];

    branches.forEach(branch => {
      const branchRooms = [
        {
          name: `Sala 1 - Premium`,
          capacity: 120,
          type: 'premium',
          branchId: branch.id,
          location: 'Planta Baja',
          rows: 10,
          seatsPerRow: 12,
          status: 'active',
          seatMap: generateSeatMap(10, 12)
        },
        {
          name: `Sala 2 - IMAX`,
          capacity: 200,
          type: 'imax',
          branchId: branch.id,
          location: 'Segundo Piso',
          rows: 12,
          seatsPerRow: 18,
          status: 'active',
          seatMap: generateSeatMap(12, 18)
        },
        {
          name: `Sala 3 - Standard`,
          capacity: 150,
          type: 'standard',
          branchId: branch.id,
          location: 'Primer Piso',
          rows: 10,
          seatsPerRow: 15,
          status: 'active',
          seatMap: generateSeatMap(10, 15)
        },
        {
          name: `Sala 4 - VIP`,
          capacity: 80,
          type: 'vip',
          branchId: branch.id,
          location: 'Tercer Piso',
          rows: 8,
          seatsPerRow: 10,
          status: 'active',
          seatMap: generateSeatMap(8, 10)
        }
      ];
      rooms.push(...branchRooms);
    });

    const createdRooms = await Room.bulkCreate(rooms);
    console.log('✅ Salas creadas');

    // --- FUNCIONES DE CINE ---
    console.log('🕐 Creando funciones (Octubre - Noviembre 2025)...');
    const showtimes = [];
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-11-30');

    // Horarios disponibles
    const timeSlots = ['14:00', '16:30', '19:00', '21:30'];

    // Crear aproximadamente 100 funciones distribuidas
    const targetShowtimes = 100;
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const showtimesPerDay = Math.ceil(targetShowtimes / daysDiff);

    console.log(`📅 Creando ~${showtimesPerDay} funciones por día...`);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Crear algunas funciones para este día
      const dailyShowtimes = Math.floor(Math.random() * 3) + 1; // 1-3 funciones por día
      
      for (let i = 0; i < dailyShowtimes; i++) {
        // Seleccionar elementos aleatorios
        const randomBranch = getRandomItems(branches, 1)[0];
        const randomMovie = getRandomItems(movies, 1)[0];
        const branchRooms = createdRooms.filter(r => r.branchId === randomBranch.id);
        const randomRoom = getRandomItems(branchRooms, 1)[0];
        const randomTime = getRandomItems(timeSlots, 1)[0];

        // Precio basado en tipo de sala
        const roomTypePrices = { standard: 45, premium: 65, imax: 85, vip: 120 };
        const basePrice = roomTypePrices[randomRoom.type] || 45;
        const finalPrice = basePrice + (randomMovie.price - 60); // Ajustar según película

        showtimes.push({
          movieId: randomMovie.id,
          roomId: randomRoom.id,
          branchId: randomBranch.id,
          startsAt: new Date(`${date.toISOString().split('T')[0]}T${randomTime}:00`),
          price: finalPrice,
          seatsAvailable: randomRoom.capacity,
          occupiedSeats: {}
        });

        // Si llegamos al target, salir
        if (showtimes.length >= targetShowtimes) break;
      }
      
      if (showtimes.length >= targetShowtimes) break;
    }

    await Showtime.bulkCreate(showtimes);
    console.log(`✅ ${showtimes.length} funciones creadas`);

    console.log('\n🎉 Base de datos 2025 poblada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${branches.length} sucursales`);
    console.log(`   - ${users.length} usuarios`);
    console.log(`   - ${movies.length} películas`);
    console.log(`   - ${createdRooms.length} salas`);
    console.log(`   - ${showtimes.length} funciones de cine`);
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   Admin: admin@cineconnect.com / password');
    console.log('   Cliente: cliente@ejemplo.com / password');
    console.log(`\n📅 Funciones desde: ${startDate.toISOString().split('T')[0]}`);
    console.log(`📅 Funciones hasta: ${endDate.toISOString().split('T')[0]}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

resetAndSeed();