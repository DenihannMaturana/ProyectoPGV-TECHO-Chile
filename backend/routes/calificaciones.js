import express from 'express';
import CalificacionController from '../controllers/calificacionController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route POST /api/calificaciones
 * @desc Crear una nueva calificación para un técnico
 * @access Beneficiario
 * @body {number} id_incidencia - ID de la incidencia
 * @body {number} id_tecnico - ID del técnico a calificar
 * @body {number} calificacion - Calificación del 1 al 5
 * @body {string} [comentario] - Comentario opcional
 */
router.post('/', CalificacionController.crear);

/**
 * @route GET /api/calificaciones/ranking
 * @desc Obtener ranking de técnicos por calificación
 * @access Admin, Técnico
 * @query {number} [limite=10] - Número máximo de resultados
 */
router.get('/ranking', CalificacionController.obtenerRanking);

/**
 * @route GET /api/calificaciones/mis-estadisticas
 * @desc Obtener estadísticas propias del técnico autenticado
 * @access Técnico
 */
router.get('/mis-estadisticas', CalificacionController.obtenerMisEstadisticas);

/**
 * @route GET /api/calificaciones/mis-calificaciones
 * @desc Obtener calificaciones recibidas por el técnico autenticado
 * @access Técnico
 * @query {number} [limite=50] - Número máximo de resultados
 * @query {number} [offset=0] - Número de resultados a saltar
 */
router.get('/mis-calificaciones', CalificacionController.obtenerMisCalificaciones);

/**
 * @route GET /api/calificaciones/incidencia/:id_incidencia
 * @desc Obtener calificación de una incidencia específica
 * @access Admin, Técnico, Beneficiario (con restricciones)
 * @param {number} id_incidencia - ID de la incidencia
 */
router.get('/incidencia/:id_incidencia', CalificacionController.obtenerPorIncidencia);

/**
 * @route GET /api/calificaciones/tecnico/:id_tecnico
 * @desc Obtener calificaciones de un técnico específico
 * @access Admin, Técnico (solo las propias)
 * @param {number} id_tecnico - ID del técnico
 * @query {number} [limite=50] - Número máximo de resultados
 * @query {number} [offset=0] - Número de resultados a saltar
 */
router.get('/tecnico/:id_tecnico', CalificacionController.obtenerPorTecnico);

/**
 * @route GET /api/calificaciones/tecnico/:id_tecnico/estadisticas
 * @desc Obtener estadísticas de calificación de un técnico
 * @access Admin, Técnico (solo las propias)
 * @param {number} id_tecnico - ID del técnico
 */
router.get('/tecnico/:id_tecnico/estadisticas', CalificacionController.obtenerEstadisticas);

/**
 * @route PUT /api/calificaciones/:id_calificacion
 * @desc Actualizar una calificación existente
 * @access Beneficiario (solo las propias), Admin
 * @param {number} id_calificacion - ID de la calificación
 * @body {number} [calificacion] - Nueva calificación del 1 al 5
 * @body {string} [comentario] - Nuevo comentario
 */
router.put('/:id_calificacion', CalificacionController.actualizar);

/**
 * @route DELETE /api/calificaciones/:id_calificacion
 * @desc Eliminar una calificación
 * @access Admin
 * @param {number} id_calificacion - ID de la calificación
 */
router.delete('/:id_calificacion', CalificacionController.eliminar);

export default router;