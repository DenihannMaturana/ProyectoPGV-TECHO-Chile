import { supabase } from '../supabaseClient.js';

class CalificacionTecnico {
  /**
   * Crear una nueva calificación para un técnico
   * @param {Object} calificacionData - Datos de la calificación
   * @param {number} calificacionData.id_incidencia - ID de la incidencia
   * @param {number} calificacionData.id_tecnico - ID del técnico calificado
   * @param {number} calificacionData.id_beneficiario - ID del beneficiario que califica
   * @param {number} calificacionData.calificacion - Calificación del 1 al 5
   * @param {string} calificacionData.comentario - Comentario opcional
   * @returns {Promise<Object>} La calificación creada
   */
  static async crear(calificacionData) {
    try {
      const { id_incidencia, id_tecnico, id_beneficiario, calificacion, comentario } = calificacionData;
      
      // Validar que la calificación esté en el rango correcto
      if (calificacion < 1 || calificacion > 5) {
        throw new Error('La calificación debe estar entre 1 y 5');
      }

      // Verificar que no exista ya una calificación para esta incidencia
      const { data: existente } = await supabase
        .from('calificaciones_tecnicos')
        .select('id_calificacion')
        .eq('id_incidencia', id_incidencia)
        .single();

      if (existente) {
        throw new Error('Ya existe una calificación para esta incidencia');
      }

      const { data, error } = await supabase
        .from('calificaciones_tecnicos')
        .insert({
          id_incidencia,
          id_tecnico,
          id_beneficiario,
          calificacion,
          comentario: comentario || null
        })
        .select(`
          *,
          tecnico:usuarios!calificaciones_tecnicos_id_tecnico_fkey(uid, nombre, email),
          beneficiario:usuarios!calificaciones_tecnicos_id_beneficiario_fkey(uid, nombre, email),
          incidencia:incidencias(id_incidencia, categoria, descripcion)
        `)
        .single();

      if (error) {
        console.error('Error creando calificación:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en CalificacionTecnico.crear:', error);
      throw error;
    }
  }

  /**
   * Obtener calificaciones de un técnico
   * @param {number} id_tecnico - ID del técnico
   * @param {Object} filtros - Filtros opcionales
   * @param {number} filtros.limite - Límite de resultados
   * @param {number} filtros.offset - Offset para paginación
   * @returns {Promise<Array>} Lista de calificaciones del técnico
   */
  static async obtenerPorTecnico(id_tecnico, filtros = {}) {
    try {
      const { limite = 50, offset = 0 } = filtros;

      let query = supabase
        .from('calificaciones_tecnicos')
        .select(`
          *,
          beneficiario:usuarios!calificaciones_tecnicos_id_beneficiario_fkey(uid, nombre),
          incidencia:incidencias(id_incidencia, categoria, descripcion, fecha_reporte)
        `)
        .eq('id_tecnico', id_tecnico)
        .order('fecha_calificacion', { ascending: false });

      if (limite) query = query.limit(limite);
      if (offset) query = query.range(offset, offset + limite - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo calificaciones:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en CalificacionTecnico.obtenerPorTecnico:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de calificación de un técnico
   * @param {number} id_tecnico - ID del técnico
   * @returns {Promise<Object>} Estadísticas de calificación
   */
  static async obtenerEstadisticas(id_tecnico) {
    try {
      console.log('[CalificacionTecnico] Buscando estadísticas para técnico:', id_tecnico, 'Tipo:', typeof id_tecnico);
      
      // Calcular directamente desde la tabla
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones_tecnicos')
        .select('calificacion')
        .eq('id_tecnico', id_tecnico);
      
      console.log('[CalificacionTecnico] Calificaciones encontradas:', calificaciones?.length || 0);
      console.log('[CalificacionTecnico] Datos:', calificaciones);

      if (calError) {
        console.error('[CalificacionTecnico] Error obteniendo calificaciones:', calError);
        throw calError;
      }

      if (!calificaciones || calificaciones.length === 0) {
        console.log('[CalificacionTecnico] No hay calificaciones para este técnico');
        return {
          id_tecnico,
          nombre_tecnico: null,
          total_calificaciones: 0,
          promedio_calificacion: null,
          calificaciones_positivas: 0,
          calificaciones_negativas: 0
        };
      }

      // Calcular estadísticas manualmente
      const total = calificaciones.length;
      const suma = calificaciones.reduce((acc, c) => acc + c.calificacion, 0);
      const promedio = Math.round((suma / total) * 10) / 10; // 1 decimal
      const positivas = calificaciones.filter(c => c.calificacion >= 4).length;
      const negativas = calificaciones.filter(c => c.calificacion <= 2).length;

      const resultado = {
        id_tecnico,
        nombre_tecnico: null,
        total_calificaciones: total,
        promedio_calificacion: promedio,
        calificaciones_positivas: positivas,
        calificaciones_negativas: negativas
      };
      
      console.log('[CalificacionTecnico] Resultado calculado:', resultado);
      return resultado;

    } catch (error) {
      console.error('[CalificacionTecnico] Error en obtenerEstadisticas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de calificación de técnicos en proyectos específicos
   * @param {Array<number>} id_proyectos - IDs de los proyectos
   * @returns {Promise<Object>} Estadísticas de calificación consolidadas
   */
  static async obtenerEstadisticasPorProyectos(id_proyectos) {
    try {
      console.log('[CalificacionTecnico] Buscando estadísticas para proyectos:', id_proyectos);
      
      if (!id_proyectos || id_proyectos.length === 0) {
        console.log('[CalificacionTecnico] No hay proyectos asignados');
        return {
          total_calificaciones: 0,
          promedio_calificacion: null,
          calificaciones_positivas: 0,
          calificaciones_negativas: 0
        };
      }

      // Primero obtener las incidencias de esos proyectos
      const { data: incidencias, error: incError } = await supabase
        .from('incidencias')
        .select('id_incidencia, viviendas!inner(id_proyecto)')
        .in('viviendas.id_proyecto', id_proyectos);

      if (incError) {
        console.error('[CalificacionTecnico] Error obteniendo incidencias:', incError);
        throw incError;
      }

      if (!incidencias || incidencias.length === 0) {
        console.log('[CalificacionTecnico] No hay incidencias en estos proyectos');
        return {
          total_calificaciones: 0,
          promedio_calificacion: null,
          calificaciones_positivas: 0,
          calificaciones_negativas: 0
        };
      }

      const incidenciaIds = incidencias.map(i => i.id_incidencia);
      console.log('[CalificacionTecnico] Incidencias encontradas:', incidenciaIds.length);

      // Ahora obtener las calificaciones de esas incidencias
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones_tecnicos')
        .select('calificacion')
        .in('id_incidencia', incidenciaIds);
      
      console.log('[CalificacionTecnico] Calificaciones en proyectos encontradas:', calificaciones?.length || 0);
      console.log('[CalificacionTecnico] Datos calificaciones:', calificaciones);

      if (calError) {
        console.error('[CalificacionTecnico] Error obteniendo calificaciones:', calError);
        throw calError;
      }

      if (!calificaciones || calificaciones.length === 0) {
        console.log('[CalificacionTecnico] No hay calificaciones en estos proyectos');
        return {
          total_calificaciones: 0,
          promedio_calificacion: null,
          calificaciones_positivas: 0,
          calificaciones_negativas: 0
        };
      }

      // Calcular estadísticas manualmente
      const total = calificaciones.length;
      const suma = calificaciones.reduce((acc, c) => acc + c.calificacion, 0);
      const promedio = Math.round((suma / total) * 10) / 10; // 1 decimal
      const positivas = calificaciones.filter(c => c.calificacion >= 4).length;
      const negativas = calificaciones.filter(c => c.calificacion <= 2).length;

      const resultado = {
        total_calificaciones: total,
        promedio_calificacion: promedio,
        calificaciones_positivas: positivas,
        calificaciones_negativas: negativas
      };
      
      console.log('[CalificacionTecnico] Resultado proyectos calculado:', resultado);
      return resultado;

    } catch (error) {
      console.error('[CalificacionTecnico] Error en obtenerEstadisticasPorProyectos:', error);
      throw error;
    }
  }

  /**
   * Verificar si una incidencia ya tiene calificación
   * @param {number} id_incidencia - ID de la incidencia
   * @returns {Promise<Object|null>} La calificación existente o null
   */
  static async obtenerPorIncidencia(id_incidencia) {
    try {
      const { data, error } = await supabase
        .from('calificaciones_tecnicos')
        .select(`
          *,
          tecnico:usuarios!calificaciones_tecnicos_id_tecnico_fkey(uid, nombre),
          beneficiario:usuarios!calificaciones_tecnicos_id_beneficiario_fkey(uid, nombre)
        `)
        .eq('id_incidencia', id_incidencia)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error obteniendo calificación de incidencia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en CalificacionTecnico.obtenerPorIncidencia:', error);
      throw error;
    }
  }

  /**
   * Actualizar una calificación existente
   * @param {number} id_calificacion - ID de la calificación
   * @param {Object} datosActualizacion - Nuevos datos
   * @returns {Promise<Object>} La calificación actualizada
   */
  static async actualizar(id_calificacion, datosActualizacion) {
    try {
      const { calificacion, comentario } = datosActualizacion;

      // Validar que la calificación esté en el rango correcto
      if (calificacion && (calificacion < 1 || calificacion > 5)) {
        throw new Error('La calificación debe estar entre 1 y 5');
      }

      const updates = {};
      if (calificacion !== undefined) updates.calificacion = calificacion;
      if (comentario !== undefined) updates.comentario = comentario;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('calificaciones_tecnicos')
        .update(updates)
        .eq('id_calificacion', id_calificacion)
        .select(`
          *,
          tecnico:usuarios!calificaciones_tecnicos_id_tecnico_fkey(uid, nombre),
          beneficiario:usuarios!calificaciones_tecnicos_id_beneficiario_fkey(uid, nombre)
        `)
        .single();

      if (error) {
        console.error('Error actualizando calificación:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en CalificacionTecnico.actualizar:', error);
      throw error;
    }
  }

  /**
   * Eliminar una calificación
   * @param {number} id_calificacion - ID de la calificación
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  static async eliminar(id_calificacion) {
    try {
      const { error } = await supabase
        .from('calificaciones_tecnicos')
        .delete()
        .eq('id_calificacion', id_calificacion);

      if (error) {
        console.error('Error eliminando calificación:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en CalificacionTecnico.eliminar:', error);
      throw error;
    }
  }

  /**
   * Obtener rankings de técnicos por calificación
   * @param {Object} filtros - Filtros opcionales
   * @param {number} filtros.limite - Límite de resultados
   * @returns {Promise<Array>} Ranking de técnicos ordenados por calificación
   */
  static async obtenerRanking(filtros = {}) {
    try {
      const { limite = 10 } = filtros;

      let query = supabase
        .from('vista_calificaciones_tecnicos')
        .select('*')
        .order('promedio_calificacion', { ascending: false })
        .order('total_calificaciones', { ascending: false });

      if (limite) query = query.limit(limite);

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo ranking:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en CalificacionTecnico.obtenerRanking:', error);
      throw error;
    }
  }
}

export default CalificacionTecnico;