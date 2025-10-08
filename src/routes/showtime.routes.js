const express = require('express');
const {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  createBatchShowtimes,
  adjustShowtime,
  getShowtimeSeatMap
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
 *         roomTypeId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         startsAt:
 *           type: string
 *           format: date-time
 *         seatsAvailable:
 *           type: integer
 *         audioType:
 *           type: string
 *           enum: [original, dubbed, subtitled]
 *         status:
 *           type: string
 *           enum: [scheduled, active, cancelled, completed]
 *         batchId:
 *           type: string
 *         originalShowtimeId:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /showtimes:
 *   get:
 *     summary: Obtener todas las funciones con filtros avanzados
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
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de sucursal
 *       - in: query
 *         name: roomTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por tipo de sala
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, active, cancelled, completed]
 *         description: Filtrar por estado
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
 * /showtimes/{id}/seat-map:
 *   get:
 *     summary: Obtener mapa de asientos de una función
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
 *         description: Mapa de asientos obtenido exitosamente
 */
router.get('/:id/seat-map', getShowtimeSeatMap);

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
 *               - roomTypeId
 *               - branchId
 *               - startsAt
 *               - audioType
 *             properties:
 *               movieId:
 *                 type: string
 *                 format: uuid
 *               roomId:
 *                 type: string
 *                 format: uuid
 *               roomTypeId:
 *                 type: string
 *                 format: uuid
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               audioType:
 *                 type: string
 *                 enum: [original, dubbed, subtitled]
 *                 default: original
 *     responses:
 *       201:
 *         description: Función creada exitosamente
 *       400:
 *         description: Conflicto de horario con otra función
 *       404:
 *         description: Película, sala, tipo de sala o sucursal no encontrados
 */
router.post('/', authenticateToken, isAdmin, createShowtime);

/**
 * @swagger
 * /showtimes/batch:
 *   post:
 *     summary: Crear funciones en lote desde plantilla (Solo admin)
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
 *               - templateId
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Funciones creadas en lote exitosamente
 */
router.post('/batch', authenticateToken, isAdmin, createBatchShowtimes);

/**
 * @swagger
 * /showtimes/{id}/adjust:
 *   patch:
 *     summary: Ajustar una función existente (Solo admin)
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
 *             type: object
 *             properties:
 *               newStartsAt:
 *                 type: string
 *                 format: date-time
 *               newRoomId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Función ajustada exitosamente
 *       400:
 *         description: No se puede ajustar una función con reservas confirmadas
 */
router.patch('/:id/adjust', authenticateToken, isAdmin, adjustShowtime);

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
 *       400:
 *         description: No se puede modificar una función con reservas confirmadas
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
 *       400:
 *         description: No se puede eliminar una función con reservas activas
 */
router.delete('/:id', authenticateToken, isAdmin, deleteShowtime);

module.exports = router;