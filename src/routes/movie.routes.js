const express = require('express');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieShowtimes,
  searchMoviePoster,
  updateMoviePoster
} = require('../controllers/movie.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Movie:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         genre:
 *           type: string
 *         duration:
 *           type: integer
 *         rating:
 *           type: number
 *         poster:
 *           type: string
 *         description:
 *           type: string
 *         releaseDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [coming_soon, now_playing, finished]
 *         audioTypes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [original, dubbed, subtitled]
 *         formats:
 *           type: array
 *           items:
 *             type: string
 *             enum: [2D, 3D, IMAX, 4DX]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Obtener todas las películas con filtros
 *     tags: [Películas]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filtrar por género
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en título o descripción
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal (a través de funciones)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha de función
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [coming_soon, now_playing, finished]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de películas obtenida exitosamente
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
 *                         $ref: '#/components/schemas/Movie'
 */
router.get('/', getAllMovies);

/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Obtener una película por ID con sus funciones
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la película
 *     responses:
 *       200:
 *         description: Película obtenida exitosamente
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
 *                     movie:
 *                       $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Película no encontrada
 */
router.get('/:id', getMovieById);

/**
 * @swagger
 * /movies/{id}/showtimes:
 *   get:
 *     summary: Obtener funciones de una película específica
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la película
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha
 *     responses:
 *       200:
 *         description: Funciones obtenidas exitosamente
 */
router.get('/:id/showtimes', getMovieShowtimes);

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Crear una nueva película (Solo admin)
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - genre
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *               genre:
 *                 type: string
 *               duration:
 *                 type: integer
 *               rating:
 *                 type: number
 *               poster:
 *                 type: string
 *               description:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_playing, finished]
 *                 default: now_playing
 *               audioTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [original, dubbed, subtitled]
 *                 default: [original]
 *               formats:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [2D, 3D, IMAX, 4DX]
 *                 default: [2D]
 *     responses:
 *       201:
 *         description: Película creada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Se requieren privilegios de admin
 */
router.post('/', authenticateToken, isAdmin, createMovie);

/**
 * @swagger
 * /movies/{id}:
 *   put:
 *     summary: Actualizar una película (Solo admin)
 *     tags: [Películas]
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
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       200:
 *         description: Película actualizada exitosamente
 *       404:
 *         description: Película no encontrada
 */
router.put('/:id', authenticateToken, isAdmin, updateMovie);

/**
 * @swagger
 * /movies/{id}:
 *   delete:
 *     summary: Eliminar una película (Solo admin)
 *     tags: [Películas]
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
 *         description: Película eliminada exitosamente
 *       404:
 *         description: Película no encontrada
 *       400:
 *         description: No se puede eliminar la película porque tiene funciones con reservas activas
 */
router.delete('/:id', authenticateToken, isAdmin, deleteMovie);

/**
 * @swagger
 * /movies/{id}/poster:
 *   patch:
 *     summary: Actualizar el póster de una película usando OMDb (Solo admin)
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la película
 *     responses:
 *       200:
 *         description: Póster actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     oldPoster:
 *                       type: string
 *                     newPoster:
 *                       type: string
 *                     movie:
 *                       $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Película no encontrada o no se pudo encontrar póster
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Se requieren privilegios de admin
 */
router.patch('/:id/poster', authenticateToken, isAdmin, updateMoviePoster); // ← Agregar esta línea

module.exports = router;