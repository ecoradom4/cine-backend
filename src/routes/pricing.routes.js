const express = require('express');
const {
  getAllPricingRules,
  createPricingRule,
  calculatePrice
} = require('../controllers/pricing.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PricingRule:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [time_based, day_based, special, format_based]
 *         roomTypeId:
 *           type: string
 *           format: uuid
 *         seatTypeId:
 *           type: string
 *           format: uuid
 *         audioType:
 *           type: string
 *           enum: [original, dubbed, subtitled]
 *         format:
 *           type: string
 *           enum: [2D, 3D, IMAX, 4DX]
 *         dayOfWeek:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         startTime:
 *           type: string
 *           format: time
 *         endTime:
 *           type: string
 *           format: time
 *         multiplier:
 *           type: number
 *           format: float
 *         fixedPrice:
 *           type: number
 *           format: float
 *         isActive:
 *           type: boolean
 *         validFrom:
 *           type: string
 *           format: date-time
 *         validUntil:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /pricing/rules:
 *   get:
 *     summary: Obtener todas las reglas de precio
 *     tags: [Precios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reglas de precio obtenida exitosamente
 */
router.get('/rules', authenticateToken, isAdmin, getAllPricingRules);

/**
 * @swagger
 * /pricing/rules:
 *   post:
 *     summary: Crear una nueva regla de precio (Solo admin)
 *     tags: [Precios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PricingRule'
 *     responses:
 *       201:
 *         description: Regla de precio creada exitosamente
 */
router.post('/rules', authenticateToken, isAdmin, createPricingRule);

/**
 * @swagger
 * /pricing/calculate:
 *   post:
 *     summary: Calcular precio para una función y asientos
 *     tags: [Precios]
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
 *                 example: ["A1", "A2"]
 *     responses:
 *       200:
 *         description: Precio calculado exitosamente
 */
router.post('/calculate', authenticateToken, calculatePrice);

module.exports = router;