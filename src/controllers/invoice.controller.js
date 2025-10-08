const { Invoice, Booking, User, Showtime, Movie, Room, Branch } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createTransporter } = require('../config/email'); 

const getAllInvoices = async (req, res, next) => {
  try {
    const { userId, startDate, endDate, status } = req.query;
    
    const where = {};
    
    // Si no es admin, solo puede ver sus propias facturas
    if (!req.user.isAdmin) {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = { id };
    
    // Si no es admin, solo puede ver sus propias facturas
    if (!req.user.isAdmin) {
      where.userId = req.user.id;
    }

    const invoice = await Invoice.findOne({
      where,
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' },
                { model: Branch, as: 'branch' }
              ]
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const invoiceData = req.body;

    // Validar datos requeridos
    if (!invoiceData.userId || !invoiceData.amount || !invoiceData.bookingIds) {
      return res.status(400).json({
        success: false,
        message: 'userId, amount y bookingIds son requeridos'
      });
    }

    // Generar número de factura único
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const invoice = await Invoice.create({
      ...invoiceData,
      invoiceNumber,
      issueDate: new Date(),
      status: 'issued'
    });

    // Asociar las reservas con la factura
    if (invoiceData.bookingIds && invoiceData.bookingIds.length > 0) {
      await Booking.update(
        { invoiceId: invoice.id },
        { 
          where: { 
            id: { [Op.in]: invoiceData.bookingIds } 
          } 
        }
      );
    }

    const invoiceWithDetails = await Invoice.findByPk(invoice.id, {
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' }
              ]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: invoiceWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'issued', 'paid', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Si se marca como pagada, establecer fecha de pago
    const updateData = { status };
    if (status === 'paid' && invoice.status !== 'paid') {
      updateData.paymentDate = new Date();
    }

    await invoice.update(updateData);

    res.json({
      success: true,
      message: 'Estado de factura actualizado exitosamente',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const getUserInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const invoices = await Invoice.findAll({
      where: { userId },
      include: [
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    await invoice.update(updateData);

    const updatedInvoice = await Invoice.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' }
              ]
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Factura actualizada exitosamente',
      data: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

const generateInvoicePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = { id };
    if (!req.user.isAdmin) {
      where.userId = req.user.id;
    }

    const invoice = await Invoice.findOne({
      where,
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' },
                { model: Branch, as: 'branch' }
              ]
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.invoiceNumber}.pdf`);
    
    // Pipe el PDF a la respuesta
    doc.pipe(res);

    // Logo y encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('CINE TICKET SYSTEM', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Sistema de Gestión de Cine', 50, 75);
    
    // Línea separadora
    doc.moveTo(50, 90).lineTo(550, 90).stroke();
    
    // Información de la factura
    doc.fontSize(16).font('Helvetica-Bold').text('FACTURA', 50, 110);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Número: ${invoice.invoiceNumber}`, 400, 110);
    doc.text(`Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}`, 400, 125);
    doc.text(`Estado: ${invoice.status.toUpperCase()}`, 400, 140);
    
    // Información del cliente
    doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE:', 50, 170);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${invoice.user.name}`, 50, 190);
    doc.text(`Email: ${invoice.user.email}`, 50, 205);
    
    // Detalles de las reservas
    let yPosition = 260;
    doc.fontSize(12).font('Helvetica-Bold').text('DETALLES DE LA RESERVA:', 50, yPosition);
    yPosition += 30;

    invoice.bookings.forEach((booking, index) => {
      const showtime = booking.showtime;
      const movie = showtime.movie;
      const room = showtime.room;
      const branch = showtime.branch;

      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(10).font('Helvetica-Bold').text(`Reserva ${index + 1}:`, 50, yPosition);
      yPosition += 15;
      doc.font('Helvetica').text(`Película: ${movie.title}`, 70, yPosition);
      yPosition += 15;
      doc.text(`Sala: ${room.name} - ${branch?.name || 'Sucursal'}`, 70, yPosition);
      yPosition += 15;
      doc.text(`Fecha y hora: ${new Date(showtime.startsAt).toLocaleString('es-ES')}`, 70, yPosition);
      yPosition += 15;
      doc.text(`Asientos: ${booking.seats ? booking.seats.join(', ') : 'No especificado'}`, 70, yPosition);
      yPosition += 15;
      doc.text(`Precio: Q${booking.totalPrice || 0}`, 70, yPosition);
      yPosition += 20;
    });

    // Totales
    const subtotal = invoice.amount || 0;
    const taxAmount = invoice.taxAmount || 0;
    const totalAmount = invoice.totalAmount || subtotal + taxAmount;

    doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN DE PAGO:', 350, yPosition);
    yPosition += 20;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Subtotal: Q${subtotal.toFixed(2)}`, 370, yPosition);
    yPosition += 15;
    doc.text(`Impuestos: Q${taxAmount.toFixed(2)}`, 370, yPosition);
    yPosition += 15;
    doc.font('Helvetica-Bold').text(`Total: Q${totalAmount.toFixed(2)}`, 370, yPosition);

    // Información de pago
    yPosition += 40;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Método de pago: ${invoice.paymentMethod || 'No especificado'}`, 50, yPosition);
    if (invoice.paymentDate) {
      yPosition += 15;
      doc.text(`Fecha de pago: ${new Date(invoice.paymentDate).toLocaleDateString('es-ES')}`, 50, yPosition);
    }

    // Pie de página
    const footerY = 750;
    doc.fontSize(8).text('Gracias por su compra', 50, footerY);
    doc.text('Cine Ticket System - Sistema de Gestión de Cine', 400, footerY, { align: 'right' });

    // Finalizar el PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF de la factura'
    });
  }
};
const sendInvoiceEmail = async (invoice) => {
  try {
    const transporter = createTransporter();
    
    const pdfBuffer = await generateInvoicePDFBuffer(invoice);
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .invoice-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .details { margin: 20px 0; }
          .footer { background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .button { background: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CINE CONNECT</h1>
          <p>Factura de compra</p>
        </div>
        
        <div class="content">
          <h2>¡Gracias por tu compra, ${invoice.customerName}!</h2>
          <p>Adjuntamos tu factura por la compra realizada en Cine Connect.</p>
          
          <div class="invoice-info">
            <h3>Resumen de la factura</h3>
            <p><strong>Número de factura:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Fecha de emisión:</strong> ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}</p>
            <p><strong>Estado:</strong> ${invoice.status}</p>
            <p><strong>Total:</strong> Q${invoice.totalAmount}</p>
          </div>
          
          <div class="details">
            <h3>Detalles de la compra:</h3>
            <table>
              <thead>
                <tr>
                  <th>Película</th>
                  <th>Sala</th>
                  <th>Fecha</th>
                  <th>Asientos</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.bookings.map(booking => `
                  <tr>
                    <td>${booking.showtime.movie.title}</td>
                    <td>${booking.showtime.room.name}</td>
                    <td>${new Date(booking.showtime.startsAt).toLocaleString('es-ES')}</td>
                    <td>${booking.seats.join(', ')}</td>
                    <td>Q${booking.totalPrice}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <p>También hemos enviado tus tickets de entrada por separado.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        </div>
        
        <div class="footer">
          <p>Gracias por elegir Cine Connect</p>
          <p>Emitido: ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'cine-connect@tuapp.com',
      to: invoice.customerEmail,
      subject: `Factura ${invoice.invoiceNumber} - Cine Connect`,
      html: emailHTML,
      attachments: [
        {
          filename: `factura-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Factura enviada por email a: ${invoice.customerEmail}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error enviando factura por email:', error);
    throw error;
  }
};
const generateInvoicePDFBuffer = async (invoice) => {
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

      // Logo y encabezado
      doc.fontSize(20).font('Helvetica-Bold').text('CINE CONNECT', 50, 50);
      doc.fontSize(10).font('Helvetica').text('Sistema de Gestión de Cine', 50, 75);
      
      // Línea separadora
      doc.moveTo(50, 90).lineTo(550, 90).stroke();
      
      // Información de la factura
      doc.fontSize(16).font('Helvetica-Bold').text('FACTURA', 50, 110);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Número: ${invoice.invoiceNumber}`, 400, 110);
      doc.text(`Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}`, 400, 125);
      doc.text(`Estado: ${invoice.status.toUpperCase()}`, 400, 140);
      
      // Información del cliente
      doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE:', 50, 170);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${invoice.customerName}`, 50, 190);
      doc.text(`Email: ${invoice.customerEmail}`, 50, 205);
      
      // Detalles de las reservas
      let yPosition = 260;
      doc.fontSize(12).font('Helvetica-Bold').text('DETALLES DE LA RESERVA:', 50, yPosition);
      yPosition += 30;

      invoice.bookings.forEach((booking, index) => {
        const showtime = booking.showtime;
        const movie = showtime.movie;
        const room = showtime.room;
        const branch = showtime.branch;

        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(10).font('Helvetica-Bold').text(`Reserva ${index + 1}:`, 50, yPosition);
        yPosition += 15;
        doc.font('Helvetica').text(`Película: ${movie.title}`, 70, yPosition);
        yPosition += 15;
        doc.text(`Sala: ${room.name} - ${branch?.name || 'Sucursal'}`, 70, yPosition);
        yPosition += 15;
        doc.text(`Fecha y hora: ${new Date(showtime.startsAt).toLocaleString('es-ES')}`, 70, yPosition);
        yPosition += 15;
        doc.text(`Asientos: ${booking.seats ? booking.seats.join(', ') : 'No especificado'}`, 70, yPosition);
        yPosition += 15;
        doc.text(`Precio: Q${booking.totalPrice || 0}`, 70, yPosition);
        yPosition += 20;
      });

      // Totales
      const subtotal = invoice.subtotal || 0;
      const taxAmount = invoice.taxAmount || 0;
      const totalAmount = invoice.totalAmount || subtotal + taxAmount;

      doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN DE PAGO:', 350, yPosition);
      yPosition += 20;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Subtotal: Q${subtotal.toFixed(2)}`, 370, yPosition);
      yPosition += 15;
      doc.text(`Impuestos: Q${taxAmount.toFixed(2)}`, 370, yPosition);
      yPosition += 15;
      doc.font('Helvetica-Bold').text(`Total: Q${totalAmount.toFixed(2)}`, 370, yPosition);

      // Información de pago
      yPosition += 40;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Método de pago: ${invoice.paymentMethod || 'No especificado'}`, 50, yPosition);
      if (invoice.paymentDate) {
        yPosition += 15;
        doc.text(`Fecha de pago: ${new Date(invoice.paymentDate).toLocaleDateString('es-ES')}`, 50, yPosition);
      }

      // Pie de página
      const footerY = 750;
      doc.fontSize(8).text('Gracias por su compra', 50, footerY);
      doc.text('Cine Connect - Sistema de Gestión de Cine', 400, footerY, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
const sendInvoiceByEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = { id };
    if (!req.user.isAdmin) {
      where.userId = req.user.id;
    }

    const invoice = await Invoice.findOne({
      where,
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: [
                { model: Movie, as: 'movie' },
                { model: Room, as: 'room' },
                { model: Branch, as: 'branch' }
              ]
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    await sendInvoiceEmail(invoice);

    res.json({
      success: true,
      message: 'Factura enviada por email exitosamente'
    });
  } catch (error) {
    console.error('Error enviando factura por email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar la factura por email'
    });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  getUserInvoices,
  updateInvoice,
  generateInvoicePDF,
  sendInvoiceByEmail,
  sendInvoiceEmail,
  generateInvoicePDFBuffer
};