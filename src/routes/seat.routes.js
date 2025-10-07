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
 * /showtimes/{id}/seats:
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
 *     responses:
 *       200:
 *         description: Mapa de asientos obtenido exitosamente
 */
router.get('/showtimes/:id/seats', getShowtimeSeats);

/**
 * @swagger
 * /showtimes/{id}/seats/reserve:
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
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asientos reservados temporalmente
 */
router.post('/showtimes/:id/seats/reserve', authenticateToken, reserveSeats);

/**
 * @swagger
 * /showtimes/{id}/seats/release:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservationId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asientos liberados exitosamente
 */
router.patch('/showtimes/:id/seats/release', authenticateToken, releaseSeats);

module.exports = router;