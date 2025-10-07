const express = require('express');
const {
  generateTicket,
  getQRCode,
  validateTicket,
  sendTicketEmail
} = require('../controllers/ticket.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /tickets/bookings/{id}/ticket:
 *   get:
 *     summary: Descargar ticket PDF con QR
 *     description: Genera y descarga un ticket en formato PDF que incluye un código QR para validación
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
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: PDF del ticket generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/bookings/:id/ticket', authenticateToken, generateTicket);

/**
 * @swagger
 * /tickets/bookings/{id}/qr:
 *   get:
 *     summary: Obtener solo el QR code del ticket
 *     description: Retorna el código QR del ticket en formato base64 para mostrar en la aplicación
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
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: QR code obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCode:
 *                       type: string
 *                       description: Código QR en base64
 *                     ticketNumber:
 *                       type: string
 *                       description: Número del ticket
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/bookings/:id/qr', authenticateToken, getQRCode);

/**
 * @swagger
 * /tickets/bookings/{id}/send-email:
 *   post:
 *     summary: Enviar ticket por email
 *     description: Envía el ticket con QR al email del usuario asociado a la reserva
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
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Ticket enviado por email exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Error al enviar el email
 */
router.post('/bookings/:id/send-email', authenticateToken, sendTicketEmail);

/**
 * @swagger
 * /tickets/validate:
 *   post:
 *     summary: Validar ticket por QR (para personal)
 *     description: Endpoint para que el personal del cine valide tickets escaneando el código QR
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
 *                 description: Número del ticket a validar
 *                 example: "TKT-123456789-abc123"
 *     responses:
 *       200:
 *         description: Ticket validado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         ticketNumber:
 *                           type: string
 *                         seats:
 *                           type: array
 *                           items:
 *                             type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                         movie:
 *                           type: string
 *                         showtime:
 *                           type: string
 *                         room:
 *                           type: string
 *       404:
 *         description: Ticket no válido
 *       400:
 *         description: Ticket no confirmado o función ya pasada
 */
router.post('/validate', validateTicket);

module.exports = router;