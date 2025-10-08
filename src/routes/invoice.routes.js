const express = require('express');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  generateInvoicePDF,
  getUserInvoices
} = require('../controllers/invoice.controller');
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');


const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         invoiceNumber:
 *           type: string
 *         issueDate:
 *           type: string
 *           format: date-time
 *         subtotal:
 *           type: number
 *           format: float
 *         taxAmount:
 *           type: number
 *           format: float
 *         totalAmount:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *           enum: [draft, issued, paid, cancelled]
 *         customerName:
 *           type: string
 *         customerTaxId:
 *           type: string
 *         customerEmail:
 *           type: string
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, transfer, digital_wallet]
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Obtener todas las facturas del usuario (o todas para admin)
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de facturas obtenida exitosamente
 */
router.get('/', authenticateToken, getAllInvoices);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtener una factura por ID
 *     tags: [Facturas]
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
 *         description: Factura obtenida exitosamente
 *       404:
 *         description: Factura no encontrada
 */
router.get('/:id', authenticateToken, getInvoiceById);

/**
 * @swagger
 * /invoices/{id}/pdf:
 *   get:
 *     summary: Descargar factura en PDF
 *     tags: [Facturas]
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
 *         description: PDF de factura generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/pdf', authenticateToken, generateInvoicePDF);

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Crear una nueva factura (Solo admin)
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       201:
 *         description: Factura creada exitosamente
 */
router.post('/', authenticateToken, isAdmin, createInvoice);

/**
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Actualizar una factura (Solo admin)
 *     tags: [Facturas]
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
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       200:
 *         description: Factura actualizada exitosamente
 */
router.put('/:id', authenticateToken, isAdmin, updateInvoice);

/**
 * @swagger
 * /invoices/user/my-invoices:
 *   get:
 *     summary: Obtener las facturas del usuario autenticado
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Facturas del usuario obtenidas exitosamente
 */
router.get('/user/my-invoices', authenticateToken, getUserInvoices);

/**
 * @swagger
 * /invoices/{id}/send-email:
 *   post:
 *     summary: Enviar factura por email
 *     tags: [Facturas]
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
 *         description: Factura enviada por email exitosamente
 */
router.post('/:id/send-email', authenticateToken, invoiceController.sendInvoiceByEmail);

module.exports = router;