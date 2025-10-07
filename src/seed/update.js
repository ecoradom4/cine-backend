// src/seed/update.js
require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Movie, Room, Showtime, Booking, Branch } = require('../models');
const bcrypt = require('bcryptjs');

// =========================
// FUNCIONES AUXILIARES
// =========================

// Generar mapa de asientos
function generateSeatMap(rows, seatsPerRow, type) {
  const seatMap = {};
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < rows; r++) {
    const rowLetter = letters[r];
    seatMap[rowLetter] = [];
    for (let s = 1; s <= seatsPerRow; s++) {
      seatMap[rowLetter].push({
        seat: `${rowLetter}${s}`,
        type,
        reserved: false
      });
    }
  }
  return seatMap;
}

// Seleccionar salas aleatorias
function getRandomRooms(rooms, count) {
  const shuffled = [...rooms].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Seleccionar horarios aleatorios
function getRandomTimeSlots(slots, count) {
  const shuffled = [...slots].sort(() => 0.5 - Math.random());
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
        state: 'Guatemala',
        phone: '+502 2234 5678',
        openingHours: 'Lunes a Domingo: 9:00 AM - 12:00 AM',
        status: 'active'
      },
      {
        name: 'Cine Connect Metronorte',
        address: 'Plaza Norte, Carretera al Atlántico Km 12.5',
        city: 'Ciudad de Guatemala',
        state: 'Guatemala',
        phone: '+502 2234 5679',
        openingHours: 'Lunes a Domingo: 10:00 AM - 11:00 PM',
        status: 'active'
      },
      {
        name: 'Cine Connect Miraflores',
        address: 'Centro Comercial Miraflores, Calzada Roosevelt',
        city: 'Ciudad de Guatemala',
        state: 'Guatemala',
        phone: '+502 2234 5680',
        openingHours: 'Lunes a Domingo: 9:30 AM - 11:30 PM',
        status: 'active'
      },
      {
        name: 'Cine Connect Antigua',
        address: '4a Calle Oriente #15, Antigua Guatemala',
        city: 'Antigua Guatemala',
        state: 'Sacatepéquez',
        phone: '+502 7832 4567',
        openingHours: 'Lunes a Domingo: 10:00 AM - 10:00 PM',
        status: 'active'
      }
    ], { ignoreDuplicates: true });
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
    ], { ignoreDuplicates: true });
    console.log('✅ Usuarios creados');

    // --- PELÍCULAS ---
    console.log('🎞️ Creando películas...');
    const movies = await Movie.bulkCreate([
      {
        title: "Avatar 3: The Seed Bearer",
        genre: "Ciencia Ficción, Aventura, Fantasía",
        duration: 180,
        rating: 8.5,
        director: "James Cameron",
        cast: ["Sam Worthington", "Zoe Saldaña"],
        releaseDate: new Date('2025-12-19'),
        description: "La continuación de la épica saga de Pandora.",
        price: 75.00,
        branchId: branches[0].id, // Zona 4
        poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400"
      },
      {
        title: "Avengers: Secret Wars",
        genre: "Acción, Aventura, Ciencia Ficción",
        duration: 160,
        rating: 8.8,
        director: "Destin Daniel Cretton",
        cast: ["Brie Larson", "Tom Hiddleston"],
        releaseDate: new Date('2025-05-02'),
        description: "Los Vengadores se enfrentan a su mayor desafío.",
        price: 80.00,
        branchId: branches[1].id, // Metronorte
        poster: "https://images.unsplash.com/photo-1635863138275-d9b33299680a?w=400"
      },
      {
        title: "Zootopia 2",
        genre: "Animación, Comedia, Aventura, Familia",
        duration: 110,
        rating: 8.0,
        director: "Byron Howard",
        cast: ["Ginnifer Goodwin", "Jason Bateman"],
        releaseDate: new Date('2025-11-26'),
        description: "Judy Hopps y Nick Wilde regresan en una nueva aventura.",
        price: 60.00,
        branchId: branches[2].id, // Miraflores
        poster: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400"
      },
      {
        title: "The Batman: Part II",
        genre: "Acción, Crimen, Drama",
        duration: 165,
        rating: 8.6,
        director: "Matt Reeves",
        cast: ["Robert Pattinson", "Zoë Kravitz"],
        releaseDate: new Date('2025-10-03'),
        description: "Batman enfrenta nuevos y peligrosos villanos.",
        price: 72.00,
        branchId: branches[3].id, // Antigua
        poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400"
      },
      // Películas adicionales para tener más datos de prueba
      {
        title: "Spider-Man: Beyond the Spider-Verse",
        genre: "Animación, Acción, Aventura",
        duration: 140,
        rating: 8.7,
        director: "Joaquim Dos Santos",
        cast: ["Shameik Moore", "Hailee Steinfeld"],
        releaseDate: new Date('2025-03-15'),
        description: "Miles Morales continúa su viaje a través del multiverso.",
        price: 68.00,
        branchId: branches[0].id, // Zona 4
        poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400"
      },
      {
        title: "Frozen 3",
        genre: "Animación, Musical, Aventura, Familia",
        duration: 115,
        rating: 7.9,
        director: "Chris Buck",
        cast: ["Kristen Bell", "Idina Menzel"],
        releaseDate: new Date('2025-11-10'),
        description: "Elsa y Anna regresan en una nueva aventura mágica.",
        price: 58.00,
        branchId: branches[1].id, // Metronorte
        poster: "https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400"
      },
      {
        title: "John Wick: Chapter 5",
        genre: "Acción, Crimen, Suspenso",
        duration: 155,
        rating: 8.3,
        director: "Chad Stahelski",
        cast: ["Keanu Reeves", "Ian McShane"],
        releaseDate: new Date('2025-09-20'),
        description: "John Wick continúa su lucha contra la Alta Mesa.",
        price: 70.00,
        branchId: branches[2].id, // Miraflores
        poster: "https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=400"
      },
      {
        title: "Dune: Part Three",
        genre: "Ciencia Ficción, Aventura, Drama",
        duration: 190,
        rating: 8.9,
        director: "Denis Villeneuve",
        cast: ["Timothée Chalamet", "Zendaya"],
        releaseDate: new Date('2025-12-15'),
        description: "La conclusión de la épica adaptación de Dune.",
        price: 78.00,
        branchId: branches[3].id, // Antigua
        poster: "https://images.unsplash.com/photo-1642618215095-3523a9a36893?w=400"
      }
    ], { ignoreDuplicates: true });
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
          seatMap: generateSeatMap(10, 12, 'premium')
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
          seatMap: generateSeatMap(12, 18, 'imax')
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
          seatMap: generateSeatMap(10, 15, 'standard')
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
          seatMap: generateSeatMap(8, 10, 'vip')
        }
      ];
      rooms.push(...branchRooms);
    });

    const createdRooms = await Room.bulkCreate(rooms, { ignoreDuplicates: true, returning: true });
    console.log('✅ Salas creadas');

    // === FUNCIONES DE APOYO INTERNAS ===
    function getMovieBranchProbability(movieId, branchId) {
      // Películas blockbuster en todas las sucursales
      const blockbusterMovies = [movies[0].id, movies[1].id, movies[4].id, movies[7].id];
      if (blockbusterMovies.includes(movieId)) return 0.9;

      // Películas familiares en sucursales familiares
      const familyMovies = [movies[2].id, movies[5].id];
      if (familyMovies.includes(movieId) && [branches[1].id, branches[3].id].includes(branchId)) return 0.7;

      return 0.6; // Probabilidad base más alta para tener más showtimes
    }

    // --- FUNCIONES DE CINE ---
    console.log('🕐 Creando funciones desde Agosto a Noviembre 2025...');
    const showtimes = [];
    const startDate = new Date('2025-08-01');
    const endDate = new Date('2025-11-30');

    const branchSchedules = {
      [branches[0].id]: { weekdays: ['14:00', '16:30', '19:00', '21:30'], weekends: ['11:00', '13:30', '16:00', '18:30', '21:00'] },
      [branches[1].id]: { weekdays: ['15:00', '17:30', '20:00'], weekends: ['10:30', '13:00', '15:30', '18:00', '20:30'] },
      [branches[2].id]: { weekdays: ['14:30', '17:00', '19:30'], weekends: ['11:30', '14:00', '16:30', '19:00', '21:30'] },
      [branches[3].id]: { weekdays: ['13:00', '15:30', '18:00'], weekends: ['10:00', '12:30', '15:00', '17:30', '20:00'] }
    };

    const roomTypePrices = { standard: 45, premium: 65, imax: 85, vip: 120 };

    let totalShowtimes = 0;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      branches.forEach(branch => {
        const schedule = branchSchedules[branch.id];
        if (!schedule) return;
        const timeSlots = isWeekend ? schedule.weekends : schedule.weekdays;
        const branchRooms = createdRooms.filter(r => r.branchId === branch.id);

        movies.forEach(movie => {
          // Solo crear showtimes para películas que pertenecen a esta sucursal
          if (movie.branchId !== branch.id) return;

          const prob = getMovieBranchProbability(movie.id, branch.id);
          if (Math.random() > prob) return;

          const roomsForMovie = getRandomRooms(branchRooms, 2);
          roomsForMovie.forEach(room => {
            const times = getRandomTimeSlots(timeSlots, 2);
            times.forEach(time => {
              showtimes.push({
                movieId: movie.id,
                roomId: room.id,
                branchId: branch.id,
                startsAt: new Date(`${date.toISOString().split('T')[0]}T${time}:00`),
                price: roomTypePrices[room.type] || 45,
                seatsAvailable: room.capacity,
                occupiedSeats: {}
              });
              totalShowtimes++;
            });
          });
        });
      });
    }

    await Showtime.bulkCreate(showtimes, { ignoreDuplicates: true });
    console.log(`✅ ${totalShowtimes} funciones creadas`);

    console.log('\n🎉 Base de datos 2025 poblada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${branches.length} sucursales`);
    console.log(`   - ${users.length} usuarios`);
    console.log(`   - ${movies.length} películas`);
    console.log(`   - ${createdRooms.length} salas`);
    console.log(`   - ${totalShowtimes} funciones de cine`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

resetAndSeed();