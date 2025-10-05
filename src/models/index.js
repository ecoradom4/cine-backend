const User = require('./User');
const Movie = require('./Movie');
const Room = require('./Room');
const Showtime = require('./Showtime');
const Booking = require('./Booking');

// Relaciones
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Movie.hasMany(Showtime, { foreignKey: 'movieId', as: 'showtimes' });
Showtime.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });

Room.hasMany(Showtime, { foreignKey: 'roomId', as: 'showtimes' });
Showtime.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Showtime.hasMany(Booking, { foreignKey: 'showtimeId', as: 'bookings' });
Booking.belongsTo(Showtime, { foreignKey: 'showtimeId', as: 'showtime' });

module.exports = {
  User,
  Movie,
  Room,
  Showtime,
  Booking
};