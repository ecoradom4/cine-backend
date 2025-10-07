// routes/cartelera.routes.js
const express = require('express');
const { getCartelera, getShowtimesByMovie } = require('../controllers/cartelera.controller');

const router = express.Router();

/**
 * @swagger
 * /cartelera:
 *   get:
 *     summary: Obtener cartelera con filtros
 *     tags: [Cartelera]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha (YYYY-MM-DD)
 *       - in: query
 *         name: genero
 *         schema:
 *           type: string
 *         description: Filtrar por género
 *       - in: query
 *         name: sucursalId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en título o descripción
 *     responses:
 *       200:
 *         description: Cartelera obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           genre:
 *                             type: string
 *                           duration:
 *                             type: integer
 *                           poster:
 *                             type: string
 *                           showtimes:
 *                             type: array
 *                             items:
 *                               type: object
 */
router.get('/', getCartelera);

/**
 * @swagger
 * /cartelera/movie/{movieId}:
 *   get:
 *     summary: Obtener funciones específicas de una película
 *     tags: [Cartelera]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sucursalId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Funciones obtenidas exitosamente
 */
router.get('/movie/:movieId', getShowtimesByMovie);

module.exports = router;