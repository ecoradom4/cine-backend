const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  sendTicketEmail
} = require('../controllers/booking.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         showtimeId:
 *           type: string
 *           format: uuid
 *         seats:
 *           type: array
 *           items:
 *             type: string
 *         totalPrice:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, expired]
 *         ticketNumber:
 *           type: string
 *         invoiceId:
 *           type: string
 *           format: uuid
 *         promotionId:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - showtimeId
 *               - seats
 *             properties:
 *               showtimeId:
 *                 type: string
 *                 format: uuid
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 example: ["A1", "A2"]
 *               promotionCode:
 *                 type: string
 *                 description: Código de promoción opcional
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *       400:
 *         description: No hay suficientes asientos disponibles o promoción inválida
 *       404:
 *         description: Función no encontrada
 */
router.post('/', authenticateToken, createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Obtener todas las reservas del usuario
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reservas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.get('/', authenticateToken, getUserBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Obtener una reserva por ID
 *     tags: [Reservas]
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
 *         description: Reserva obtenida exitosamente
 *       404:
 *         description: Reserva no encontrada
 */
router.get('/:id', authenticateToken, getBookingById);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancelar una reserva
 *     tags: [Reservas]
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
 *         description: Reserva cancelada exitosamente
 *       404:
 *         description: Reserva no encontrada
 *       400:
 *         description: No se puede cancelar una reserva de una función ya realizada
 */
router.delete('/:id', authenticateToken, cancelBooking);

/**
 * @swagger
 * /bookings/{id}/send-ticket:
 *   post:
 *     summary: Enviar ticket por email
 *     tags: [Reservas]
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
 *       404:
 *         description: Reserva no encontrada
 */
router.post('/:id/send-ticket', authenticateToken, sendTicketEmail);

module.exports = router;