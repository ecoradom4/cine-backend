const express = require('express');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/schedule.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ScheduleTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         daysOfWeek:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 0
 *             maximum: 6
 *         showtimes:
 *           type: array
 *           items:
 *             type: string
 *             format: time
 *         audioType:
 *           type: string
 *           enum: [original, dubbed, subtitled]
 *         status:
 *           type: string
 *           enum: [active, inactive, completed]
 *         movieId:
 *           type: string
 *           format: uuid
 *         roomId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /schedule/templates:
 *   get:
 *     summary: Obtener todas las plantillas de programación
 *     tags: [Programación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas obtenida exitosamente
 */
router.get('/templates', authenticateToken, isAdmin, getAllTemplates);

/**
 * @swagger
 * /schedule/templates/{id}:
 *   get:
 *     summary: Obtener una plantilla por ID
 *     tags: [Programación]
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
 *         description: Plantilla obtenida exitosamente
 */
router.get('/templates/:id', authenticateToken, isAdmin, getTemplateById);

/**
 * @swagger
 * /schedule/templates:
 *   post:
 *     summary: Crear una nueva plantilla de programación (Solo admin)
 *     tags: [Programación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleTemplate'
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente
 */
router.post('/templates', authenticateToken, isAdmin, createTemplate);

/**
 * @swagger
 * /schedule/templates/{id}:
 *   put:
 *     summary: Actualizar una plantilla de programación (Solo admin)
 *     tags: [Programación]
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
 *             $ref: '#/components/schemas/ScheduleTemplate'
 *     responses:
 *       200:
 *         description: Plantilla actualizada exitosamente
 */
router.put('/templates/:id', authenticateToken, isAdmin, updateTemplate);

/**
 * @swagger
 * /schedule/templates/{id}:
 *   delete:
 *     summary: Eliminar una plantilla de programación (Solo admin)
 *     tags: [Programación]
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
 *         description: Plantilla eliminada exitosamente
 */
router.delete('/templates/:id', authenticateToken, isAdmin, deleteTemplate);

module.exports = router;