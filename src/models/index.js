const User = require('./User');
const Movie = require('./Movie');
const Room = require('./Room');
const Showtime = require('./Showtime');
const Booking = require('./Booking');
const Branch = require('./Branch');
const SeatReservation = require('./SeatReservation');

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

module.exports = {
  User,
  Movie,
  Room,
  Showtime,
  Booking,
  Branch,
  SeatReservation
};