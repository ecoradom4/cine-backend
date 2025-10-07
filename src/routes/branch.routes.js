const express = require('express');
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branch.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: Obtener todas las sucursales activas
 *     tags: [Sucursales]
 *     responses:
 *       200:
 *         description: Lista de sucursales obtenida exitosamente
 */
router.get('/', getAllBranches);

/**
 * @swagger
 * /branches/{id}:
 *   get:
 *     summary: Obtener una sucursal por ID
 *     tags: [Sucursales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sucursal obtenida exitosamente
 *       404:
 *         description: Sucursal no encontrada
 */
router.get('/:id', getBranchById);

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Crear una nueva sucursal (Solo admin)
 *     tags: [Sucursales]
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
 *               - address
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               phone:
 *                 type: string
 *               openingHours:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sucursal creada exitosamente
 */
router.post('/', authenticateToken, isAdmin, createBranch);

/**
 * @swagger
 * /branches/{id}:
 *   put:
 *     summary: Actualizar una sucursal (Solo admin)
 *     tags: [Sucursales]
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
 *             $ref: '#/components/schemas/Branch'
 *     responses:
 *       200:
 *         description: Sucursal actualizada exitosamente
 */
router.put('/:id', authenticateToken, isAdmin, updateBranch);

/**
 * @swagger
 * /branches/{id}:
 *   delete:
 *     summary: Desactivar una sucursal (Solo admin)
 *     tags: [Sucursales]
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
 *         description: Sucursal desactivada exitosamente
 */
router.delete('/:id', authenticateToken, isAdmin, deleteBranch);

module.exports = router;