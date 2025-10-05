const express = require('express');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
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
 *         type:
 *           type: string
 *         status:
 *           type: string
 *         location:
 *           type: string
 */

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Obtener todas las salas
 *     tags: [Salas]
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
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *               location:
 *                 type: string
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
 */
router.delete('/:id', authenticateToken, isAdmin, deleteRoom);

module.exports = router;