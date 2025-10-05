const express = require('express');
const {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime
} = require('../controllers/showtime.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Showtime:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         movieId:
 *           type: string
 *           format: uuid
 *         roomId:
 *           type: string
 *           format: uuid
 *         startsAt:
 *           type: string
 *           format: date-time
 *         price:
 *           type: number
 *           format: float
 *         seatsAvailable:
 *           type: integer
 */

/**
 * @swagger
 * /showtimes:
 *   get:
 *     summary: Obtener todas las funciones
 *     tags: [Funciones]
 *     parameters:
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de película
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de sala
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de funciones obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Showtime'
 */
router.get('/', getAllShowtimes);

/**
 * @swagger
 * /showtimes/{id}:
 *   get:
 *     summary: Obtener una función por ID
 *     tags: [Funciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Función obtenida exitosamente
 *       404:
 *         description: Función no encontrada
 */
router.get('/:id', getShowtimeById);

/**
 * @swagger
 * /showtimes:
 *   post:
 *     summary: Crear una nueva función (Solo admin)
 *     tags: [Funciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *               - roomId
 *               - startsAt
 *               - price
 *             properties:
 *               movieId:
 *                 type: string
 *                 format: uuid
 *               roomId:
 *                 type: string
 *                 format: uuid
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Función creada exitosamente
 */
router.post('/', authenticateToken, isAdmin, createShowtime);

/**
 * @swagger
 * /showtimes/{id}:
 *   put:
 *     summary: Actualizar una función (Solo admin)
 *     tags: [Funciones]
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
 *             $ref: '#/components/schemas/Showtime'
 *     responses:
 *       200:
 *         description: Función actualizada exitosamente
 */
router.put('/:id', authenticateToken, isAdmin, updateShowtime);

/**
 * @swagger
 * /showtimes/{id}:
 *   delete:
 *     summary: Eliminar una función (Solo admin)
 *     tags: [Funciones]
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
 *         description: Función eliminada exitosamente
 */
router.delete('/:id', authenticateToken, isAdmin, deleteShowtime);

module.exports = router;