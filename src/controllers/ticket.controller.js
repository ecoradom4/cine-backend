const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { Booking, Showtime, Movie, Room, User } = require('../models');
const { createTransporter } = require('../config/email');

// Generar y descargar ticket PDF con QR
const generateTicket = async (req, res, next) => {
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
            { model: Movie, as: 'movie' },
            { model: Room, as: 'room' }
          ]
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Generar QR si no existe
    if (!booking.qrCode) {
      await generateQRCodeForBooking(booking);
    }

    // Crear PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.ticketNumber}.pdf`);
    
    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Contenido del ticket
    // Header
    doc.fontSize(20).font('Helvetica-Bold')
       .fillColor('#2c5aa0')
       .text('CINE CONNECT', 50, 50, { align: 'center' });
    
    doc.fontSize(12).font('Helvetica')
       .fillColor('#666')
       .text('Tu entrada al mejor cine', 50, 75, { align: 'center' });

    // Línea separadora
    doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#2c5aa0').lineWidth(2).stroke();

    // Información de la película
    doc.fontSize(16).font('Helvetica-Bold')
       .fillColor('#000')
       .text(booking.showtime.movie.title, 50, 120);
    
    doc.fontSize(12).font('Helvetica')
       .fillColor('#666')
       .text(`Género: ${booking.showtime.movie.genre}`, 50, 145)
       .text(`Duración: ${booking.showtime.movie.duration} min`, 50, 160);

    // Información de la función
    const showtimeDate = new Date(booking.showtime.startsAt);
    doc.text(`Fecha: ${showtimeDate.toLocaleDateString('es-ES')}`, 50, 180)
       .text(`Hora: ${showtimeDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, 50, 195)
       .text(`Sala: ${booking.showtime.room.name}`, 50, 210);

    // Información de asientos y precio
    doc.text(`Asientos: ${booking.seats.join(', ')}`, 50, 235)
       .text(`Total: Q${booking.totalPrice}`, 50, 250);

    // Número de ticket
    doc.fontSize(10).fillColor('#999')
       .text(`Ticket: ${booking.ticketNumber}`, 50, 275);

    // QR Code (imagen base64)
    if (booking.qrCode) {
      const qrBuffer = Buffer.from(booking.qrCode.split(',')[1], 'base64');
      doc.image(qrBuffer, 400, 120, { width: 120, height: 120 });
      
      doc.fontSize(8).fillColor('#666')
         .text('Escanea este código en la entrada', 400, 250, { width: 120, align: 'center' });
    }

    // Footer
    doc.fontSize(8).fillColor('#999')
       .text('Gracias por elegir Cine Connect', 50, 350, { align: 'center' })
       .text(`Emitido: ${new Date().toLocaleString('es-ES')}`, 50, 365, { align: 'center' });

    doc.end();

  } catch (error) {
    next(error);
  }
};

// Obtener solo el QR code
const getQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, userId },
      attributes: ['id', 'qrCode', 'ticketNumber']
    });

    if (!booking || !booking.qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code no disponible'
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: booking.qrCode,
        ticketNumber: booking.ticketNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validar ticket por QR (para personal de entrada)
const validateTicket = async (req, res, next) => {
  try {
    const { ticketNumber } = req.body;

    const booking = await Booking.findOne({
      where: { ticketNumber },
      include: [
        {
          model: Showtime,
          as: 'showtime',
          include: [
            { model: Movie, as: 'movie' },
            { model: Room, as: 'room' }
          ]
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no válido'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket no confirmado o cancelado'
      });
    }

    // Verificar que la función no haya pasado
    const showtimeDate = new Date(booking.showtime.startsAt);
    if (showtimeDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La función ya ha pasado'
      });
    }

    res.json({
      success: true,
      message: 'Ticket válido',
      data: {
        booking: {
          id: booking.id,
          ticketNumber: booking.ticketNumber,
          seats: booking.seats,
          user: {
            name: booking.user.name
          },
          movie: booking.showtime.movie.title,
          showtime: booking.showtime.startsAt,
          room: booking.showtime.room.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Endpoint para enviar ticket por email
const sendTicketEmail = async (req, res, next) => {
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
            { model: Movie, as: 'movie' },
            { model: Room, as: 'room' }
          ]
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Enviar email usando la función REAL
    await sendRealTicketEmail(booking);

    res.json({
      success: true,
      message: 'Ticket enviado por email exitosamente'
    });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el email'
    });
  }
};

// Función auxiliar para generar QR code
async function generateQRCodeForBooking(booking) {
  const qrData = JSON.stringify({
    bookingId: booking.id,
    ticketNumber: booking.ticketNumber,
    movie: booking.showtime.movie.title,
    showtime: booking.showtime.startsAt,
    seats: booking.seats
  });
  
  const qrCode = await QRCode.toDataURL(qrData);
  await booking.update({ qrCode });
  return qrCode;
}

// Función REAL para enviar ticket por email (para uso automático en createBooking y endpoint público)
async function sendRealTicketEmail(booking) {
  try {
    // Generar QR si no existe
    if (!booking.qrCode) {
      await generateQRCodeForBooking(booking);
      // Recargar el booking para obtener el QR actualizado
      booking = await Booking.findByPk(booking.id, {
        include: [
          {
            model: Showtime,
            as: 'showtime',
            include: [
              { model: Movie, as: 'movie' },
              { model: Room, as: 'room' }
            ]
          },
          {
            model: User,
            as: 'user'
          }
        ]
      });
    }

    const transporter = createTransporter();
    
    const showtimeDate = new Date(booking.showtime.startsAt);
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .ticket-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .qr-code { text-align: center; margin: 20px 0; }
          .footer { background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CINE CONNECT</h1>
          <p>Tu entrada al mejor cine</p>
        </div>
        
        <div class="content">
          <h2>¡Tu reserva está confirmada!</h2>
          
          <div class="ticket-info">
            <h3>${booking.showtime.movie.title}</h3>
            <p><strong>Fecha:</strong> ${showtimeDate.toLocaleDateString('es-ES')}</p>
            <p><strong>Hora:</strong> ${showtimeDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Sala:</strong> ${booking.showtime.room.name}</p>
            <p><strong>Asientos:</strong> ${booking.seats.join(', ')}</p>
            <p><strong>Total:</strong> Q${booking.totalPrice}</p>
          </div>
          
          <div class="qr-code">
            <img src="${booking.qrCode}" alt="QR Code" width="200" height="200">
            <p>Presenta este código QR en la entrada</p>
          </div>
          
          <p><strong>Número de ticket:</strong> ${booking.ticketNumber}</p>
        </div>
        
        <div class="footer">
          <p>Gracias por elegir Cine Connect</p>
          <p>Emitido: ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePDFBuffer(booking);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'cine-connect@tuapp.com',
      to: booking.user.email,
      subject: `Tu entrada para ${booking.showtime.movie.title} - Cine Connect`,
      html: emailHTML,
      attachments: [
        {
          filename: `ticket-${booking.ticketNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ TICKET enviado exitosamente a: ${booking.user.email}`);
    console.log(`🎬 Película: ${booking.showtime.movie.title}`);
    console.log(`🎫 Asientos: ${booking.seats.join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error en sendRealTicketEmail:', error);
    throw error;
  }
}

// Función para generar PDF en buffer
async function generatePDFBuffer(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Contenido del PDF
      doc.fontSize(20).font('Helvetica-Bold')
         .fillColor('#2c5aa0')
         .text('CINE CONNECT', 50, 50, { align: 'center' });
      
      doc.fontSize(12).font('Helvetica')
         .fillColor('#666')
         .text('Tu entrada al mejor cine', 50, 75, { align: 'center' });

      doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#2c5aa0').lineWidth(2).stroke();

      doc.fontSize(16).font('Helvetica-Bold')
         .fillColor('#000')
         .text(booking.showtime.movie.title, 50, 120);
      
      doc.fontSize(12).font('Helvetica')
         .fillColor('#666')
         .text(`Género: ${booking.showtime.movie.genre}`, 50, 145)
         .text(`Duración: ${booking.showtime.movie.duration} min`, 50, 160);

      const showtimeDate = new Date(booking.showtime.startsAt);
      doc.text(`Fecha: ${showtimeDate.toLocaleDateString('es-ES')}`, 50, 180)
         .text(`Hora: ${showtimeDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, 50, 195)
         .text(`Sala: ${booking.showtime.room.name}`, 50, 210);

      doc.text(`Asientos: ${booking.seats.join(', ')}`, 50, 235)
         .text(`Total: Q${booking.totalPrice}`, 50, 250);

      doc.fontSize(10).fillColor('#999')
         .text(`Ticket: ${booking.ticketNumber}`, 50, 275);

      // QR Code
      if (booking.qrCode) {
        const qrBuffer = Buffer.from(booking.qrCode.split(',')[1], 'base64');
        doc.image(qrBuffer, 400, 120, { width: 120, height: 120 });
        
        doc.fontSize(8).fillColor('#666')
           .text('Escanea este código en la entrada', 400, 250, { width: 120, align: 'center' });
      }

      doc.fontSize(8).fillColor('#999')
         .text('Gracias por elegir Cine Connect', 50, 350, { align: 'center' })
         .text(`Emitido: ${new Date().toLocaleString('es-ES')}`, 50, 365, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateTicket,
  getQRCode,
  validateTicket,
  sendTicketEmail,
  sendRealTicketEmail // ✅ Exportar para usar en booking.controller
};