const { Booking, Showtime, Movie, Room, RoomType, SeatReservation, Invoice, Promotion, User, Branch, PricingRule } = require('../models');
const { Op } = require('sequelize');
const { sendInvoiceEmail } = require('./invoice.controller'); 
const { sendRealTicketEmail } = require('./ticket.controller'); // ✅ Importar la función del controlador de tickets

// Función auxiliar para calcular precio dinámico
const calculateDynamicPrice = async (showtimeId, seats) => {
  try {
    const showtime = await Showtime.findByPk(showtimeId, {
      include: [
        { 
          model: Room, 
          as: 'room', 
          include: [
            {
              model: RoomType,
              as: 'type'
            }
          ]
        },
        { 
          model: RoomType, 
          as: 'roomType' 
        }
      ]
    });

    if (!showtime) {
      throw new Error('Función no encontrada');
    }

    let totalPrice = 0;
    
    for (const seat of seats) {
      // Obtener tipo de asiento del mapa de la sala
      const seatInfo = showtime.room.seatMap && showtime.room.seatMap[seat];
      const seatTypeCode = seatInfo?.type || 'standard';
      
      // Buscar regla de precio aplicable
      const pricingRule = await PricingRule.findOne({
        where: {
          roomTypeId: showtime.roomTypeId,
          isActive: true,
          [Op.or]: [
            {
              validFrom: { [Op.lte]: new Date() },
              validUntil: { [Op.gte]: new Date() }
            },
            {
              validFrom: null,
              validUntil: null
            }
          ]
        }
      });

      let seatPrice = showtime.roomType ? showtime.roomType.basePrice : 0;
      
      if (pricingRule) {
        if (pricingRule.fixedPrice) {
          seatPrice = pricingRule.fixedPrice;
        } else if (pricingRule.multiplier) {
          seatPrice *= pricingRule.multiplier;
        }
      }

      totalPrice += seatPrice;
    }

    return totalPrice;
  } catch (error) {
    console.error('Error calculando precio dinámico:', error);
    throw error;
  }
};

// Crear reserva
const createBooking = async (req, res) => {
  try {
    const { showtimeId, seats, promotionCode } = req.body;
    const userId = req.user.id;

    // Validar datos de entrada
    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. Se requieren showtimeId y una lista de asientos.'
      });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener la función con las relaciones
    const showtime = await Showtime.findByPk(showtimeId, {
      include: [
        {
          model: Movie,
          as: 'movie',
          attributes: ['id', 'title', 'duration', 'genre']
        },
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name', 'capacity', 'seatMap'],
          include: [
            {
              model: RoomType,
              as: 'type',
              attributes: ['id', 'name', 'basePrice']
            }
          ]
        },
        {
          model: RoomType, 
          as: 'roomType',
          attributes: ['id', 'name', 'basePrice']
        }
      ]
    });

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Verificar que la función esté activa
    if (showtime.status !== 'scheduled' && showtime.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'La función no está disponible para reservas'
      });
    }

    // Verificar que haya suficientes asientos disponibles
    if (showtime.seatsAvailable < seats.length) {
      return res.status(400).json({
        success: false,
        message: 'No hay suficientes asientos disponibles'
      });
    }

    // Verificar asientos disponibles
    const reservedSeats = await SeatReservation.findAll({
      where: {
        showtimeId,
        seats: { [Op.overlap]: seats },
        status: 'reserved',
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (reservedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Algunos asientos ya están reservados temporalmente'
      });
    }

    // Verificar asientos en bookings confirmados
    const confirmedBookings = await Booking.findAll({
      where: {
        showtimeId,
        status: 'confirmed'
      }
    });

    const takenSeats = confirmedBookings.flatMap(booking => booking.seats);
    const conflictingSeats = seats.filter(seat => takenSeats.includes(seat));

    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Los asientos ${conflictingSeats.join(', ')} ya están ocupados`
      });
    }

    // Calcular precio
    let totalPrice;
    try {
      totalPrice = await calculateDynamicPrice(showtimeId, seats);
    } catch (priceError) {
      // Fallback: usar precio base si falla el cálculo dinámico
      const basePrice = showtime.roomType ? showtime.roomType.basePrice : 0;
      totalPrice = basePrice * seats.length;
    }

    // Aplicar promoción si existe
    let promotion = null;
    let finalPrice = totalPrice;
    
    if (promotionCode) {
      promotion = await Promotion.findOne({
        where: {
          code: promotionCode,
          isActive: true,
          validFrom: { [Op.lte]: new Date() },
          validUntil: { [Op.gte]: new Date() },
          [Op.or]: [
            { usageLimit: { [Op.gt]: Promotion.sequelize.col('usedCount') } },
            { usageLimit: null }
          ]
        }
      });

      if (promotion) {
        if (promotion.type === 'percentage') {
          finalPrice = totalPrice * (1 - promotion.value / 100);
        } else if (promotion.type === 'fixed') {
          finalPrice = Math.max(0, totalPrice - promotion.value);
        }
        // Actualizar contador de uso
        await promotion.update({
          usedCount: promotion.usedCount + 1
        });
      }
    }

    // Crear factura
    const invoice = await Invoice.create({
      invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      issueDate: new Date(),
      subtotal: totalPrice,
      taxAmount: totalPrice * 0.12, // 12% IVA
      totalAmount: finalPrice * 1.12,
      status: 'paid',
      customerName: user.name,
      customerEmail: user.email,
      userId: userId,
      paymentMethod: 'card',
      paymentDate: new Date()
    });

    // Generar número de ticket único
    const ticketNumber = `TCK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Crear reserva
    const booking = await Booking.create({
      userId,
      showtimeId,
      invoiceId: invoice.id,
      promotionId: promotion ? promotion.id : null,
      seats,
      totalPrice: finalPrice * 1.12,
      status: 'confirmed',
      ticketNumber: ticketNumber,
      expiresAt: null
    });

    // Liberar cualquier reserva temporal de asientos
    await SeatReservation.destroy({
      where: {
        showtimeId,
        seats: { [Op.overlap]: seats },
        status: 'reserved'
      }
    });

    // Actualizar asientos disponibles en el showtime
    await showtime.update({
      seatsAvailable: showtime.seatsAvailable - seats.length
    });

    // ✅ ENVÍO AUTOMÁTICO DE AMBOS EMAILS EN SEGUNDO PLANO
    let invoiceSent = false;
    let ticketSent = false;

    try {
      // Obtener datos completos para factura
      const invoiceWithDetails = await Invoice.findByPk(invoice.id, {
        include: [
          {
            model: Booking,
            as: 'bookings',
            include: [
              {
                model: Showtime,
                as: 'showtime',
                include: [
                  { 
                    model: Movie, 
                    as: 'movie',
                    attributes: ['id', 'title', 'duration']
                  },
                  { 
                    model: Room, 
                    as: 'room',
                    attributes: ['id', 'name']
                  },
                  { 
                    model: Branch, 
                    as: 'branch',
                    attributes: ['id', 'name', 'city']
                  }
                ]
              }
            ]
          }
        ]
      });

      // Enviar FACTURA por email (correo separado)
      await sendInvoiceEmail(invoiceWithDetails);
      invoiceSent = true;
      console.log(`✅ FACTURA enviada automáticamente a: ${user.email}`);
    } catch (invoiceEmailError) {
      console.error('❌ Error enviando FACTURA automáticamente:', invoiceEmailError);
      // No fallar la reserva si el email falla
    }

    try {
      // Obtener booking completo para el ticket
      const bookingForTicket = await Booking.findByPk(booking.id, {
        include: [
          {
            model: Showtime,
            as: 'showtime',
            include: [
              { 
                model: Movie, 
                as: 'movie',
                attributes: ['id', 'title', 'duration']
              },
              { 
                model: Room, 
                as: 'room',
                attributes: ['id', 'name']
              },
              { 
                model: Branch, 
                as: 'branch',
                attributes: ['id', 'name', 'address']
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Enviar TICKET por email usando la lógica REAL de envío
      await sendRealTicketEmail(bookingForTicket);
      ticketSent = true;
      console.log(`✅ TICKET enviado automáticamente a: ${user.email}`);
    } catch (ticketEmailError) {
      console.error('❌ Error enviando TICKET automáticamente:', ticketEmailError);
      // No fallar la reserva si el email falla
    }

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        booking: {
          id: booking.id,
          ticketNumber: booking.ticketNumber,
          seats: booking.seats,
          totalPrice: booking.totalPrice,
          status: booking.status
        },
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount
        },
        showtime: {
          movie: showtime.movie.title,
          room: showtime.room.name,
          startsAt: showtime.startsAt
        },
        promotionApplied: promotion ? {
          code: promotion.code,
          discount: promotion.type === 'percentage' ? `${promotion.value}%` : `$${promotion.value}`
        } : null,
        emailsSent: {
          invoice: invoiceSent,
          ticket: ticketSent
        }
      }
    });

  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener reservas del usuario
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Showtime,
          as: 'showtime',
          include: [
            { 
              model: Movie, 
              as: 'movie',
              attributes: ['id', 'title', 'duration', 'genre', 'poster']
            },
            { 
              model: Room, 
              as: 'room',
              attributes: ['id', 'name', 'location']
            },
            { 
              model: RoomType, 
              as: 'roomType',
              attributes: ['id', 'name', 'basePrice']
            },
            { 
              model: Branch, 
              as: 'branch',
              attributes: ['id', 'name', 'city']
            }
          ]
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'status']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'name', 'code', 'type', 'value']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener reserva por ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, userId },
      include: [
        {
          model: Showtime,
          as: 'showtime',
          include: [
            { 
              model: Movie, 
              as: 'movie',
              attributes: ['id', 'title', 'duration', 'genre', 'poster', 'description']
            },
            { 
              model: Room, 
              as: 'room',
              attributes: ['id', 'name', 'location', 'capacity']
            },
            { 
              model: RoomType, 
              as: 'roomType',
              attributes: ['id', 'name', 'basePrice', 'description']
            },
            { 
              model: Branch, 
              as: 'branch',
              attributes: ['id', 'name', 'address', 'city', 'phone']
            }
          ]
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'subtotal', 'taxAmount', 'totalAmount', 'status', 'issueDate']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'name', 'code', 'type', 'value', 'description']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cancelar reserva
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, userId },
      include: [
        { 
          model: Showtime, 
          as: 'showtime',
          attributes: ['id', 'startsAt', 'status']
        },
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'status']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'La reserva ya está cancelada'
      });
    }

    // Verificar que la función no haya pasado
    const showtimeDate = new Date(booking.showtime.startsAt);
    const now = new Date();
    const timeDiff = showtimeDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1) { // No se puede cancelar 1 hora antes de la función
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar la reserva (muy cerca del horario de la función)'
      });
    }

    // Iniciar transacción para operaciones atómicas
    const transaction = await Booking.sequelize.transaction();

    try {
      // Actualizar factura
      await booking.invoice.update({ 
        status: 'cancelled',
        paymentDate: null
      }, { transaction });

      // Cancelar reserva
      await booking.update({ 
        status: 'cancelled' 
      }, { transaction });

      // Liberar asientos en el showtime
      await Showtime.update({
        seatsAvailable: Booking.sequelize.literal(`"seatsAvailable" + ${booking.seats.length}`)
      }, {
        where: { id: booking.showtimeId },
        transaction
      });

      // Revertir contador de promoción si aplica
      if (booking.promotionId) {
        const promotion = await Promotion.findByPk(booking.promotionId);
        if (promotion) {
          await promotion.update({ 
            usedCount: Math.max(0, promotion.usedCount - 1) 
          }, { transaction });
        }
      }

      await transaction.commit();

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: {
          bookingId: booking.id,
          refundAmount: booking.totalPrice
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Enviar ticket por email (Endpoint público)
const sendTicketEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, userId },
      include: [
        {
          model: Showtime,
          as: 'showtime',
          include: [
            { 
              model: Movie, 
              as: 'movie',
              attributes: ['id', 'title', 'duration']
            },
            { 
              model: Room, 
              as: 'room',
              attributes: ['id', 'name']
            },
            { 
              model: Branch, 
              as: 'branch',
              attributes: ['id', 'name', 'address']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden enviar tickets de reservas confirmadas'
      });
    }

    // Enviar el ticket REAL
    await sendRealTicketEmail(booking);

    res.json({
      success: true,
      message: 'Ticket enviado por email exitosamente',
      data: {
        sentTo: booking.user.email,
        ticketNumber: booking.ticketNumber
      }
    });

  } catch (error) {
    console.error('Error al enviar ticket por email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  sendTicketEmail
};