const express = require('express');
const {
  generateTicket,
  getQRCode,
  validateTicket
} = require('../controllers/ticket.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /bookings/{id}/ticket:
 *   get:
 *     summary: Descargar ticket PDF con QR
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF del ticket generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/bookings/:id/ticket', authenticateToken, generateTicket);

/**
 * @swagger
 * /bookings/{id}/qr:
 *   get:
 *     summary: Obtener solo el QR code del ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: QR code obtenido exitosamente
 */
router.get('/bookings/:id/qr', authenticateToken, getQRCode);

/**
 * @swagger
 * /tickets/validate:
 *   post:
 *     summary: Validar ticket por QR (para personal)
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketNumber
 *             properties:
 *               ticketNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket validado exitosamente
 */
router.post('/tickets/validate', validateTicket);


/**
 * @swagger
 * /tickets/bookings/{id}/send-email:
 *   post:
 *     summary: Enviar ticket por email
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket enviado por email exitosamente
 */
router.post('/bookings/:id/send-email', authenticateToken, sendTicketEmail);

module.exports = router;