const express = require('express');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
} = require('../controllers/movie.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Obtener todas las películas
 *     tags: [Películas]
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 */
router.get('/', getAllMovies);

/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Obtener una película por ID
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
 *                   $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Película no encontrada
 */
router.get('/:id', getMovieById);

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
 *               - price
 *               - branchId
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
 *               price:
 *                 type: number
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               branchId:
 *                 type: string
 *                 format: uuid
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
 */
router.delete('/:id', authenticateToken, isAdmin, deleteMovie);

module.exports = router;