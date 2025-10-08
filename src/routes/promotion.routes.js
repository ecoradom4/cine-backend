const express = require('express');
const {
  getAllPromotions,
  validatePromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionById 
} = require('../controllers/promotion.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Promotion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         type:
 *           type: string
 *           enum: [percentage, fixed, bogo]
 *         value:
 *           type: number
 *           format: float
 *         minPurchase:
 *           type: number
 *           format: float
 *         maxDiscount:
 *           type: number
 *           format: float
 *         validFrom:
 *           type: string
 *           format: date-time
 *         validUntil:
 *           type: string
 *           format: date-time
 *         usageLimit:
 *           type: integer
 *         usedCount:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         branchId:
 *           type: string
 *           format: uuid
 *         movieId:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /promotions:
 *   get:
 *     summary: Obtener todas las promociones
 *     tags: [Promociones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de promociones obtenida exitosamente
 */
router.get('/', authenticateToken, getAllPromotions);

/**
 * @swagger
 * /promotions/validate:
 *   post:
 *     summary: Validar una promoción
 *     tags: [Promociones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - totalAmount
 *             properties:
 *               code:
 *                 type: string
 *               showtimeId:
 *                 type: string
 *                 format: uuid
 *               totalAmount:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Promoción validada exitosamente
 *       404:
 *         description: Promoción no válida o expirada
 *       400:
 *         description: No cumple con el monto mínimo de compra
 */
router.post('/validate', authenticateToken, validatePromotion);

/**
 * @swagger
 * /promotions:
 *   post:
 *     summary: Crear una nueva promoción (Solo admin)
 *     tags: [Promociones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       201:
 *         description: Promoción creada exitosamente
 */
router.post('/', authenticateToken, isAdmin, createPromotion);

/**
 * @swagger
 * /promotions/{id}:
 *   put:
 *     summary: Actualizar una promoción (Solo admin)
 *     tags: [Promociones]
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
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       200:
 *         description: Promoción actualizada exitosamente
 */
router.put('/:id', authenticateToken, isAdmin, updatePromotion);

/**
 * @swagger
 * /promotions/{id}:
 *   delete:
 *     summary: Eliminar una promoción (Solo admin)
 *     tags: [Promociones]
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
 *         description: Promoción eliminada exitosamente
 */
router.delete('/:id', authenticateToken, isAdmin, deletePromotion);

/**
 * @swagger
 * /promotions/{id}:
 *   get:
 *     summary: Obtener una promoción por ID
 *     tags: [Promociones]
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
 *         description: Promoción obtenida exitosamente
 *       404:
 *         description: Promoción no encontrada
 */
router.get('/:id', authenticateToken, getPromotionById);

module.exports = router;