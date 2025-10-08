const User = require('./User');
const Movie = require('./Movie');
const Room = require('./Room');
const Showtime = require('./Showtime');
const Booking = require('./Booking');
const Branch = require('./Branch');
const SeatReservation = require('./SeatReservation');

// Debug: verificar que los modelos son válidos
console.log('User:', User && typeof User);
console.log('Movie:', Movie && typeof Movie);
console.log('Room:', Room && typeof Room);
console.log('Showtime:', Showtime && typeof Showtime);
console.log('Booking:', Booking && typeof Booking);
console.log('Branch:', Branch && typeof Branch);
console.log('SeatReservation:', SeatReservation && typeof SeatReservation);

// Verificar que todos sean funciones (clases)
if (typeof Showtime !== 'function') {
  console.error('ERROR: Showtime no es una función válida. Valor:', Showtime);
  process.exit(1);
}


// Importar nuevos modelos con verificación mejorada
let RoomType, SeatType, PricingRule, Invoice, Promotion, ScheduleTemplate;

// Función helper para importar modelos de forma segura
function safeRequire(modelPath) {
  try {
    const model = require(modelPath);
    // Verificar que sea un modelo válido de Sequelize
    if (model && typeof model === 'function' && model.name) {
      return model;
    }
    return null;
  } catch (error) {
    console.warn(`Model ${modelPath} not found or invalid:`, error.message);
    return null;
  }
}

RoomType = safeRequire('./RoomType');
SeatType = safeRequire('./SeatType');
PricingRule = safeRequire('./PricingRule');
Invoice = safeRequire('./Invoice');
Promotion = safeRequire('./Promotion');
ScheduleTemplate = safeRequire('./ScheduleTemplate');

// Verificar que todos los modelos principales existen
if (!User || !Movie || !Room || !Showtime || !Booking || !Branch || !SeatReservation) {
  throw new Error('Faltan modelos principales requeridos');
}

// Relaciones principales
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Movie.hasMany(Showtime, { foreignKey: 'movieId', as: 'showtimes' });
Showtime.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });

Room.hasMany(Showtime, { foreignKey: 'roomId', as: 'showtimes' });
Showtime.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Showtime.hasMany(Booking, { foreignKey: 'showtimeId', as: 'bookings' });
Booking.belongsTo(Showtime, { foreignKey: 'showtimeId', as: 'showtime' });

// Nuevas relaciones con Branch
Branch.hasMany(Room, { foreignKey: 'branchId', as: 'rooms' });
Room.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Branch.hasMany(Showtime, { foreignKey: 'branchId', as: 'showtimes' });
Showtime.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// Relaciones para reservas de asientos
Showtime.hasMany(SeatReservation, { foreignKey: 'showtimeId', as: 'seatReservations' });
SeatReservation.belongsTo(Showtime, { foreignKey: 'showtimeId', as: 'showtime' });

User.hasMany(SeatReservation, { foreignKey: 'userId', as: 'seatReservations' });
SeatReservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// NUEVAS RELACIONES - Sistema de Tipos y Precios (solo si los modelos existen y son válidos)
if (RoomType) {
  RoomType.hasMany(Room, { foreignKey: 'roomTypeId', as: 'rooms' });
  Room.belongsTo(RoomType, { foreignKey: 'roomTypeId', as: 'type' });

  RoomType.hasMany(Showtime, { foreignKey: 'roomTypeId', as: 'showtimes' });
  Showtime.belongsTo(RoomType, { foreignKey: 'roomTypeId', as: 'roomType' });
}

if (SeatType) {
  SeatType.hasMany(PricingRule, { foreignKey: 'seatTypeId', as: 'pricingRules' });
}

if (PricingRule) {
  if (RoomType) {
    PricingRule.belongsTo(RoomType, { foreignKey: 'roomTypeId', as: 'roomType' });
  }
  if (SeatType) {
    PricingRule.belongsTo(SeatType, { foreignKey: 'seatTypeId', as: 'seatType' });
  }
  if (Branch) {
    PricingRule.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
  }
}

// Facturación (solo si el modelo existe)
if (Invoice) {
  Invoice.hasMany(Booking, { foreignKey: 'invoiceId', as: 'bookings' });
  Booking.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

  User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });
  Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}

// Promociones (solo si el modelo existe)
if (Promotion) {
  Promotion.hasMany(Booking, { foreignKey: 'promotionId', as: 'bookings' });
  Booking.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

  if (Branch) {
    Branch.hasMany(Promotion, { foreignKey: 'branchId', as: 'promotions' });
    Promotion.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
  }

  if (Movie) {
    Movie.hasMany(Promotion, { foreignKey: 'movieId', as: 'promotions' });
    Promotion.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
  }
}

// Plantillas de programación (solo si el modelo existe)
if (ScheduleTemplate) {
  ScheduleTemplate.hasMany(Showtime, { foreignKey: 'templateId', as: 'generatedShowtimes' });
  Showtime.belongsTo(ScheduleTemplate, { foreignKey: 'templateId', as: 'scheduleTemplate' });

  if (Branch) {
    Branch.hasMany(ScheduleTemplate, { foreignKey: 'branchId', as: 'scheduleTemplates' });
    ScheduleTemplate.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
  }

  if (Movie) {
    Movie.hasMany(ScheduleTemplate, { foreignKey: 'movieId', as: 'scheduleTemplates' });
    ScheduleTemplate.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
  }

  if (Room) {
    Room.hasMany(ScheduleTemplate, { foreignKey: 'roomId', as: 'scheduleTemplates' });
    ScheduleTemplate.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
  }
}

// Relaciones adicionales para gestión de programación
Showtime.belongsTo(Showtime, { 
  foreignKey: 'originalShowtimeId', 
  as: 'originalShowtime' 
});
Showtime.hasMany(Showtime, { 
  foreignKey: 'originalShowtimeId', 
  as: 'adjustedShowtimes' 
});

module.exports = {
  User,
  Movie,
  Room,
  Showtime,
  Booking,
  Branch,
  SeatReservation,
  RoomType,
  SeatType,
  PricingRule,
  Invoice,
  Promotion,
  ScheduleTemplate
};