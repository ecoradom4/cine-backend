const express = require('express');
const {
  getShowtimeSeats,
  reserveSeats,
  releaseSeats
} = require('../controllers/seat.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Asientos
 *   description: Sistema de selección y reserva de asientos
 */

/**
 * @swagger
 * /seats/showtimes/{id}/seats:
 *   get:
 *     summary: Obtener mapa de asientos de una función
 *     tags: [Asientos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la función
 *     responses:
 *       200:
 *         description: Mapa de asientos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     showtimeId:
 *                       type: string
 *                     availableSeats:
 *                       type: array
 *                       items:
 *                         type: string
 *                     reservedSeats:
 *                       type: array
 *                       items:
 *                         type: string
 *                     seatMap:
 *                       type: object
 *       404:
 *         description: Función no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/showtimes/:id/seats', getShowtimeSeats);

/**
 * @swagger
 * /seats/showtimes/{id}/seats/reserve:
 *   post:
 *     summary: Reservar asientos temporalmente
 *     tags: [Asientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la función
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seats
 *             properties:
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A1", "A2", "A3"]
 *                 description: Lista de asientos a reservar
 *               sessionId:
 *                 type: string
 *                 description: ID de sesión del usuario
 *     responses:
 *       200:
 *         description: Asientos reservados temporalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asientos reservados exitosamente"
 *                 reservationId:
 *                   type: string
 *                   format: uuid
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Asientos no disponibles o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/showtimes/:id/seats/reserve', authenticateToken, reserveSeats);

/**
 * @swagger
 * /seats/showtimes/{id}/seats/release:
 *   patch:
 *     summary: Liberar asientos reservados
 *     tags: [Asientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la función
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la reserva
 *               sessionId:
 *                 type: string
 *                 description: ID de sesión del usuario
 *     responses:
 *       200:
 *         description: Asientos liberados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asientos liberados exitosamente"
 *       400:
 *         description: Reserva no encontrada o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/showtimes/:id/seats/release', authenticateToken, releaseSeats);

module.exports = router;