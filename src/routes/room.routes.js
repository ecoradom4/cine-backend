const express = require('express');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomAvailability
} = require('../controllers/room.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         capacity:
 *           type: integer
 *         roomType:
 *           type: string
 *           enum: [standard, premium, vip, imax, 4dx]
 *         status:
 *           type: string
 *           enum: [active, maintenance, inactive]
 *         location:
 *           type: string
 *         rows:
 *           type: integer
 *         seatsPerRow:
 *           type: integer
 *         seatMap:
 *           type: object
 *         branchId:
 *           type: string
 *           format: uuid
 *         roomTypeId:
 *           type: string
 *           format: uuid
 *         formats:
 *           type: array
 *           items:
 *             type: string
 *             enum: [2D, 3D, IMAX, 4DX, VIP]
 */

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Obtener todas las salas con filtros
 *     tags: [Salas]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, maintenance, inactive]
 *         description: Filtrar por estado
 *       - in: query
 *         name: roomTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por tipo de sala
 *     responses:
 *       200:
 *         description: Lista de salas obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Room'
 */
router.get('/', getAllRooms);

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Obtener una sala por ID
 *     tags: [Salas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sala obtenida exitosamente
 *       404:
 *         description: Sala no encontrada
 */
router.get('/:id', getRoomById);

/**
 * @swagger
 * /rooms/{id}/availability:
 *   get:
 *     summary: Obtener disponibilidad de una sala por fecha
 *     tags: [Salas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para consultar disponibilidad (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Disponibilidad obtenida exitosamente
 */
router.get('/:id/availability', getRoomAvailability);

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Crear una nueva sala (Solo admin)
 *     tags: [Salas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - capacity
 *               - branchId
 *               - roomTypeId
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               roomType:
 *                 type: string
 *                 enum: [standard, premium, vip, imax, 4dx]
 *               status:
 *                 type: string
 *                 enum: [active, maintenance, inactive]
 *                 default: active
 *               location:
 *                 type: string
 *               rows:
 *                 type: integer
 *               seatsPerRow:
 *                 type: integer
 *               seatMap:
 *                 type: object
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               roomTypeId:
 *                 type: string
 *                 format: uuid
 *               formats:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [2D, 3D, IMAX, 4DX, VIP]
 *                 default: [2D]
 *     responses:
 *       201:
 *         description: Sala creada exitosamente
 */
router.post('/', authenticateToken, isAdmin, createRoom);

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Actualizar una sala (Solo admin)
 *     tags: [Salas]
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
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: Sala actualizada exitosamente
 *       400:
 *         description: No se puede modificar una sala con funciones futuras programadas
 */
router.put('/:id', authenticateToken, isAdmin, updateRoom);

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Eliminar una sala (Solo admin)
 *     tags: [Salas]
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
 *         description: Sala eliminada exitosamente
 *       400:
 *         description: No se puede eliminar una sala con funciones futuras programadas
 */
router.delete('/:id', authenticateToken, isAdmin, deleteRoom);

module.exports = router;