import CalificacionTecnico from '../models/CalificacionTecnico.js';
import * as Incidence from '../models/Incidence.js';

/**
 * Controlador para el manejo de calificaciones de técnicos
 */
class CalificacionController {
  /**
   * Crear una nueva calificación para un técnico
   * POST /api/calificaciones
   */
  static async crear(req, res) {
    try {
      const { id_incidencia, id_tecnico, calificacion, comentario } = req.body;
      const id_beneficiario = req.user.uid;

      // Validar datos requeridos
      if (!id_incidencia || !id_tecnico || !calificacion) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren id_incidencia, id_tecnico y calificacion'
        });
      }

      // Validar que la calificación esté en el rango correcto
      if (calificacion < 1 || calificacion > 5) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe estar entre 1 y 5'
        });
      }

      // Verificar que la incidencia exista y esté cerrada/resuelta
      const incidencia = await Incidence.obtenerPorId(id_incidencia);
      if (!incidencia) {
        return res.status(404).json({
          success: false,
          message: 'Incidencia no encontrada'
        });
      }

      // Solo se puede calificar incidencias cerradas o resueltas
      if (!['cerrada', 'resuelta'].includes(incidencia.estado)) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden calificar incidencias cerradas o resueltas'
        });
      }

      // Verificar que el usuario sea el beneficiario de la vivienda asociada a la incidencia
      if (req.user.rol === 'beneficiario') {
        // Aquí puedes agregar lógica adicional para verificar que el beneficiario
        // tenga derecho a calificar esta incidencia
      }

      const nuevaCalificacion = await CalificacionTecnico.crear({
        id_incidencia,
        id_tecnico,
        id_beneficiario,
        calificacion,
        comentario
      });

      res.status(201).json({
        success: true,
        message: 'Calificación creada exitosamente',
        data: nuevaCalificacion
      });
    } catch (error) {
      console.error('Error en CalificacionController.crear:', error);
      
      if (error.message.includes('Ya existe una calificación')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener calificaciones de un técnico
   * GET /api/calificaciones/tecnico/:id_tecnico
   */
  static async obtenerPorTecnico(req, res) {
    try {
      const { id_tecnico } = req.params;
      const { limite = 50, offset = 0 } = req.query;

      const calificaciones = await CalificacionTecnico.obtenerPorTecnico(
        parseInt(id_tecnico),
        { limite: parseInt(limite), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        data: calificaciones
      });
    } catch (error) {
      console.error('Error en CalificacionController.obtenerPorTecnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de calificación de un técnico
   * GET /api/calificaciones/tecnico/:id_tecnico/estadisticas
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const { id_tecnico } = req.params;

      const estadisticas = await CalificacionTecnico.obtenerEstadisticas(parseInt(id_tecnico));

      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      console.error('Error en CalificacionController.obtenerEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener calificación de una incidencia específica
   * GET /api/calificaciones/incidencia/:id_incidencia
   */
  static async obtenerPorIncidencia(req, res) {
    try {
      const { id_incidencia } = req.params;

      const calificacion = await CalificacionTecnico.obtenerPorIncidencia(parseInt(id_incidencia));

      res.json({
        success: true,
        data: calificacion
      });
    } catch (error) {
      console.error('Error en CalificacionController.obtenerPorIncidencia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar una calificación existente
   * PUT /api/calificaciones/:id_calificacion
   */
  static async actualizar(req, res) {
    try {
      const { id_calificacion } = req.params;
      const { calificacion, comentario } = req.body;

      // Validar que la calificación esté en el rango correcto si se proporciona
      if (calificacion !== undefined && (calificacion < 1 || calificacion > 5)) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe estar entre 1 y 5'
        });
      }

      const calificacionActualizada = await CalificacionTecnico.actualizar(
        parseInt(id_calificacion),
        { calificacion, comentario }
      );

      res.json({
        success: true,
        message: 'Calificación actualizada exitosamente',
        data: calificacionActualizada
      });
    } catch (error) {
      console.error('Error en CalificacionController.actualizar:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar una calificación
   * DELETE /api/calificaciones/:id_calificacion
   */
  static async eliminar(req, res) {
    try {
      const { id_calificacion } = req.params;

      await CalificacionTecnico.eliminar(parseInt(id_calificacion));

      res.json({
        success: true,
        message: 'Calificación eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error en CalificacionController.eliminar:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener ranking de técnicos por calificación
   * GET /api/calificaciones/ranking
   */
  static async obtenerRanking(req, res) {
    try {
      const { limite = 10 } = req.query;

      const ranking = await CalificacionTecnico.obtenerRanking({
        limite: parseInt(limite)
      });

      res.json({
        success: true,
        data: ranking
      });
    } catch (error) {
      console.error('Error en CalificacionController.obtenerRanking:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas propias del técnico autenticado
   * GET /api/calificaciones/mis-estadisticas
   */
  static async obtenerMisEstadisticas(req, res) {
    try {
      const id_tecnico = req.user.uid;

      // Verificar que el usuario sea técnico
      if (req.user.rol !== 'tecnico') {
        return res.status(403).json({
          success: false,
          message: 'Solo los técnicos pueden acceder a sus estadísticas'
        });
      }

      const estadisticas = await CalificacionTecnico.obtenerEstadisticas(id_tecnico);

      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      console.error('Error en CalificacionController.obtenerMisEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener mis calificaciones como técnico
   * GET /api/calificaciones/mis-calificaciones
   */
  static async obtenerMisCalificaciones(req, res) {
    try {
      const id_tecnico = req.user.uid;
      const { limite = 50, offset = 0 } = req.query;

      // Verificar que el usuario sea técnico
      if (req.user.rol !== 'tecnico') {
        return res.status(403).json({
          success: false,
          message: 'Solo los técnicos pueden acceder a sus calificaciones'
        });
      }

      const calificaciones = await CalificacionTecnico.obtenerPorTecnico(
        id_tecnico,
        { limite: parseInt(limite), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        data: calificaciones
      });
    } catch (error) {
      console.error('Error en CalificacionController.obtenerMisCalificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default CalificacionController;