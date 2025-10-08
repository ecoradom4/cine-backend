// src/seed/update.js
require('dotenv').config();
const { sequelize } = require('../config/db');
const { 
  User, 
  Movie, 
  Room, 
  Showtime, 
  Booking, 
  Branch, 
  RoomType, 
  SeatType, 
  PricingRule, 
  Promotion, 
  ScheduleTemplate,
  Invoice,
  SeatReservation
} = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// =========================
// FUNCIONES AUXILIARES
// =========================

// Generar mapa de asientos según el modelo Room
function generateSeatMap(rows, seatsPerRow) {
  const seatMap = {};
  const seatTypes = ['standard', 'premium', 'vip'];
  
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // A, B, C, etc.
    
    for (let s = 1; s <= seatsPerRow; s++) {
      const seatId = `${rowLetter}${s}`;
      // Asignar tipos de asiento aleatorios con diferentes precios
      const randomType = seatTypes[Math.floor(Math.random() * seatTypes.length)];
      let price;
      
      switch (randomType) {
        case 'premium':
          price = 12.00;
          break;
        case 'vip':
          price = 15.00;
          break;
        default:
          price = 8.00;
      }
      
      seatMap[seatId] = {
        type: randomType,
        price: price,
        status: 'available'
      };
    }
  }
  return seatMap;
}

// Seleccionar elementos aleatorios
function getRandomItems(array, count) {
  if (array.length === 0) return [];
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Generar número único para ticket
function generateTicketNumber() {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Combinar fecha y hora
function combineDateTime(date, timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const newDate = new Date(date);
  newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return newDate;
}

// =========================
// FUNCIÓN PRINCIPAL CORREGIDA
// =========================

const resetAndSeed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    console.log('🔄 Sincronizando tablas...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas sincronizadas');

    // --- TIPOS DE SALA ---
    console.log('🏗️ Creando tipos de sala...');
    const roomTypes = await RoomType.bulkCreate([
      {
        name: 'Sala Estándar',
        code: 'STANDARD',
        basePrice: 45.00,
        description: 'Sala regular con sonido digital',
        features: ['sonido_digital', 'proyeccion_2d']
      },
      {
        name: 'Sala 3D',
        code: '3D',
        basePrice: 65.00,
        description: 'Sala con tecnología 3D',
        features: ['3d', 'sonido_digital', 'proyeccion_3d']
      },
      {
        name: 'Sala IMAX',
        code: 'IMAX',
        basePrice: 75.00,
        description: 'Experiencia IMAX premium',
        features: ['imax', 'pantalla_gigante', 'sonido_envolvente']
      },
      {
        name: 'Sala VIP',
        code: 'VIP',
        basePrice: 100.00,
        description: 'Experiencia VIP con servicio premium',
        features: ['asientos_reclinables', 'servicio_gourmet', 'atención_personalizada']
      }
    ]);
    console.log('✅ Tipos de sala creados');

    // --- TIPOS DE ASIENTO ---
    console.log('💺 Creando tipos de asiento...');
    const seatTypes = await SeatType.bulkCreate([
      {
        name: 'Estándar',
        code: 'STANDARD',
        priceMultiplier: 1.0,
        description: 'Asiento estándar cómodo',
        color: '#4CAF50'
      },
      {
        name: 'Premium',
        code: 'PREMIUM',
        priceMultiplier: 1.5,
        description: 'Asiento premium con más espacio',
        color: '#2196F3'
      },
      {
        name: 'VIP',
        code: 'VIP',
        priceMultiplier: 2.0,
        description: 'Asiento VIP reclinable',
        color: '#FF9800'
      }
    ]);
    console.log('✅ Tipos de asiento creados');

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
      },
      {
        name: 'Cine Connect Metronorte',
        address: 'Plaza Norte, Carretera al Atlántico Km 12.5',
        city: 'Ciudad de Guatemala',
        phone: '+502 2234 5679',
        openingHours: 'Lunes a Domingo: 10:00 AM - 11:00 PM',
        status: 'active'
      }
    ]);
    console.log('✅ Sucursales creadas');

   // --- REGLAS DE PRECIOS ---
console.log('💰 Creando reglas de precios...');
const pricingRules = await PricingRule.bulkCreate([
  // Reglas basadas en tiempo/día - TODAS deben tener roomTypeId
  {
    name: 'Descuento Matutino',
    type: 'time_based',
    roomTypeId: roomTypes[0].id, // Standard
    startTime: '09:00',
    endTime: '12:00',
    multiplier: 0.8,
    isActive: true
  },
  {
    name: 'Fin de Semana Premium',
    type: 'day_based',
    roomTypeId: roomTypes[2].id, // IMAX
    dayOfWeek: 0, // Domingo
    multiplier: 1.2,
    isActive: true
  },
  {
    name: 'Precio 3D Estándar',
    type: 'format_based',
    roomTypeId: roomTypes[1].id, // 3D
    format: '3D',
    multiplier: 1.0,
    isActive: true
  },
  {
    name: 'Audio Doblado Estándar',
    type: 'special',
    roomTypeId: roomTypes[0].id, // Standard - AÑADIDO
    audioType: 'dubbed',
    multiplier: 0.9,
    isActive: true
  },
  // Reglas adicionales para cubrir todos los roomTypes
  {
    name: 'VIP Nocturno',
    type: 'time_based',
    roomTypeId: roomTypes[3].id, // VIP
    startTime: '18:00',
    endTime: '23:00',
    multiplier: 1.3,
    isActive: true
  },
  {
    name: 'Miércoles de Descuento',
    type: 'day_based',
    roomTypeId: roomTypes[1].id, // 3D
    dayOfWeek: 3, // Miércoles
    multiplier: 0.85,
    isActive: true
  }
]);
console.log('✅ Reglas de precios creadas');

    // --- PROMOCIONES ---
    console.log('🎁 Creando promociones...');
    const promotions = await Promotion.bulkCreate([
      {
        name: 'Martes de Descuento',
        code: 'MARTES20',
        type: 'percentage',
        value: 20,
        description: '20% de descuento todos los martes',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        usageLimit: null,
        isActive: true
      },
      {
        name: 'Descuento Fijo',
        code: 'CINE10',
        type: 'fixed',
        value: 10,
        description: 'Q10 de descuento en tu compra',
        minPurchase: 50,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        isActive: true
      }
    ]);
    console.log('✅ Promociones creadas');

    // --- USUARIOS ---
    console.log('👤 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await User.bulkCreate([
      {
        name: 'Admin Principal',
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
        name: 'María García',
        email: 'maria@ejemplo.com',
        passwordHash: hashedPassword,
        role: 'cliente'
      }
    ]);
    console.log('✅ Usuarios creados');

    // --- PELÍCULAS ---
    console.log('🎞️ Creando películas...');
    const movies = await Movie.bulkCreate([
      {
        title: "Avatar: El Camino del Agua",
        genre: "Ciencia Ficción, Aventura",
        duration: 192,
        rating: 7.8,
        description: "Secuela de la épica película de ciencia ficción de James Cameron.",
        releaseDate: new Date('2022-12-16'),
        status: 'now_playing'
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        genre: "Animación, Acción, Aventura",
        duration: 140,
        rating: 8.7,
        description: "Miles Morales regresa para una nueva aventura a través del multiverso.",
        releaseDate: new Date('2023-06-02'),
        status: 'now_playing'
      },
      {
        title: "Oppenheimer",
        genre: "Drama, Histórico",
        duration: 180,
        rating: 8.5,
        description: "La historia del padre de la bomba atómica.",
        releaseDate: new Date('2023-07-21'),
        status: 'now_playing'
      },
      {
        title: "Dune: Parte Dos",
        genre: "Ciencia Ficción, Aventura",
        duration: 166,
        rating: 8.8,
        description: "Continuación de la épica adaptación de la novela de Frank Herbert.",
        releaseDate: new Date('2024-03-01'),
        status: 'coming_soon'
      }
    ]);
    console.log('✅ Películas creadas');

    // --- SALAS ---
    console.log('🎬 Creando salas...');
    const rooms = [];
    
    branches.forEach(branch => {
      // Crear 3 salas por sucursal
      for (let i = 1; i <= 3; i++) {
        const roomType = roomTypes[(i - 1) % roomTypes.length];
        const rows = 8 + (i * 2);
        const seatsPerRow = 10 + i;
        
        rooms.push({
          name: `Sala ${i} - ${branch.name.split(' ')[2]}`,
          capacity: rows * seatsPerRow,
          formats: i === 1 ? ['2D'] : i === 2 ? ['2D', '3D'] : ['IMAX', '3D'],
          status: 'active',
          location: `Nivel ${i}`,
          rows: rows,
          seatsPerRow: seatsPerRow,
          seatMap: generateSeatMap(rows, seatsPerRow),
          branchId: branch.id,
          roomTypeId: roomType.id
        });
      }
    });

    const createdRooms = await Room.bulkCreate(rooms);
    console.log('✅ Salas creadas');

    // --- PLANTILLAS DE PROGRAMACIÓN ---
    console.log('📅 Creando plantillas de programación...');
    const scheduleTemplates = await ScheduleTemplate.bulkCreate([
      {
        name: 'Programación Semanal Estándar',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
        showtimeSlots: ['14:00', '16:30', '19:00', '21:30'],
        audioType: 'subtitled',
        status: 'active',
        movieId: movies[0].id,
        roomId: createdRooms[0].id,
        branchId: branches[0].id
      }
    ]);
    console.log('✅ Plantillas de programación creadas');

    // --- FUNCIONES DE CINE ---
    console.log('🕐 Creando funciones...');
    const showtimes = [];
    const timeSlots = ['10:00', '13:00', '16:00', '19:00', '22:00'];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Funciones para los próximos 30 días

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Crear 2-4 funciones por día
      const dailyShowtimes = Math.floor(Math.random() * 3) + 2;
      const selectedTimeSlots = getRandomItems(timeSlots, dailyShowtimes);
      
      for (const timeSlot of selectedTimeSlots) {
        const randomBranch = getRandomItems(branches, 1)[0];
        const randomMovie = getRandomItems(movies, 1)[0];
        const branchRooms = createdRooms.filter(room => room.branchId === randomBranch.id);
        const randomRoom = getRandomItems(branchRooms, 1)[0];
        
        const startsAt = combineDateTime(date, timeSlot);
        
        showtimes.push({
          movieId: randomMovie.id,
          roomId: randomRoom.id,
          branchId: randomBranch.id,
          roomTypeId: randomRoom.roomTypeId,
          startsAt: startsAt,
          audioType: Math.random() > 0.5 ? 'subtitled' : 'dubbed',
          seatsAvailable: randomRoom.capacity,
          status: 'scheduled'
        });
      }
    }

    const createdShowtimes = await Showtime.bulkCreate(showtimes);
    console.log(`✅ ${showtimes.length} funciones creadas`);

    // --- RESERVAS DE ASIENTOS ---
    console.log('🎫 Creando reservas de asientos...');
    const seatReservations = [];
    const activeShowtimes = createdShowtimes.filter(s => s.startsAt > new Date());

    for (let i = 0; i < Math.min(10, activeShowtimes.length); i++) {
      const showtime = activeShowtimes[i];
      const user = users[1 + (i % 2)]; // Usar usuarios clientes
      const room = createdRooms.find(r => r.id === showtime.roomId);
      
      if (room && room.seatMap) {
        const availableSeats = Object.keys(room.seatMap).filter(seatId => 
          room.seatMap[seatId].status === 'available'
        );
        
        const selectedSeats = getRandomItems(availableSeats, Math.min(2, availableSeats.length));
        
        for (const seat of selectedSeats) {
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expira en 15 minutos
          
          seatReservations.push({
            showtimeId: showtime.id,
            userId: user.id,
            seats: [seat],
            status: 'reserved',
            expiresAt: expiresAt,
            sessionId: `session-${user.id}-${Date.now()}`
          });
        }
      }
    }

    await SeatReservation.bulkCreate(seatReservations);
    console.log(`✅ ${seatReservations.length} reservas de asientos creadas`);

    // --- FACTURAS ---
    console.log('🧾 Creando facturas...');
    const invoices = await Invoice.bulkCreate([
      {
        invoiceNumber: `INV-${Date.now()}-001`,
        issueDate: new Date(),
        subtotal: 85.00,
        taxAmount: 10.20,
        totalAmount: 95.20,
        status: 'paid',
        customerName: 'Juan Pérez',
        customerEmail: 'cliente@ejemplo.com',
        paymentMethod: 'card',
        paymentDate: new Date()
      }
    ]);
    console.log('✅ Facturas creadas');

    // --- RESERVAS CONFIRMADAS ---
    console.log('✅ Creando reservas confirmadas...');
    const bookings = await Booking.bulkCreate([
      {
        seats: ['A1', 'A2'],
        totalPrice: 95.20,
        status: 'confirmed',
        ticketNumber: generateTicketNumber(),
        qrCode: 'qr_code_base64_placeholder',
        showtimeId: activeShowtimes[0]?.id,
        userId: users[1].id
      }
    ]);
    console.log('✅ Reservas creadas');

    console.log('\n🎉 BASE DE DATOS POBLADA EXITOSAMENTE!');
    console.log('\n📊 RESUMEN:');
    console.log(`   - ${roomTypes.length} tipos de sala`);
    console.log(`   - ${seatTypes.length} tipos de asiento`);
    console.log(`   - ${branches.length} sucursales`);
    console.log(`   - ${pricingRules.length} reglas de precio`);
    console.log(`   - ${promotions.length} promociones`);
    console.log(`   - ${users.length} usuarios`);
    console.log(`   - ${movies.length} películas`);
    console.log(`   - ${createdRooms.length} salas`);
    console.log(`   - ${scheduleTemplates.length} plantillas`);
    console.log(`   - ${createdShowtimes.length} funciones`);
    console.log(`   - ${seatReservations.length} reservas de asientos`);
    console.log(`   - ${bookings.length} reservas confirmadas`);
    console.log(`   - ${invoices.length} facturas`);
    
    console.log('\n🔑 CREDENCIALES:');
    console.log('   Admin: admin@cineconnect.com / password123');
    console.log('   Cliente: cliente@ejemplo.com / password123');
    
    console.log('\n💡 CARACTERÍSTICAS IMPLEMENTADAS:');
    console.log('   ✅ Sistema completo de tipos de sala y asientos');
    console.log('   ✅ Reglas de precios flexibles (tiempo, día, formato)');
    console.log('   ✅ Gestión de promociones y descuentos');
    console.log('   ✅ Reservas de asientos en tiempo real con expiración');
    console.log('   ✅ Mapa de asientos con tipos y precios dinámicos');
    console.log('   ✅ Sistema de facturación integrado');

  } catch (error) {
    console.error('❌ Error durante la población:', error);
    console.error('Detalle del error:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔒 Conexión cerrada');
  }
};

// Ejecutar el script
resetAndSeed();