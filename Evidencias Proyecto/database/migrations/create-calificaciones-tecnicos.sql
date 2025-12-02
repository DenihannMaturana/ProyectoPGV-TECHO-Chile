-- Migración: Sistema de calificaciones para técnicos
-- Fecha: 2025-12-01
-- Descripción: Crear tabla para almacenar calificaciones que los beneficiarios dan a los técnicos

-- Crear tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones_tecnicos (
    id_calificacion BIGSERIAL PRIMARY KEY,
    id_incidencia BIGINT NOT NULL REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
    id_tecnico BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE CASCADE,
    id_beneficiario BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE CASCADE,
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    fecha_calificacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Una calificación por incidencia
    UNIQUE(id_incidencia)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_calificaciones_tecnico ON calificaciones_tecnicos(id_tecnico);
CREATE INDEX IF NOT EXISTS idx_calificaciones_beneficiario ON calificaciones_tecnicos(id_beneficiario);
CREATE INDEX IF NOT EXISTS idx_calificaciones_fecha ON calificaciones_tecnicos(fecha_calificacion);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at (eliminar primero si existe)
DROP TRIGGER IF EXISTS trigger_calificaciones_updated_at ON calificaciones_tecnicos;
CREATE TRIGGER trigger_calificaciones_updated_at
    BEFORE UPDATE ON calificaciones_tecnicos
    FOR EACH ROW
    EXECUTE FUNCTION update_calificaciones_updated_at();

-- Vista para obtener estadísticas de calificación por técnico
CREATE OR REPLACE VIEW vista_calificaciones_tecnicos AS
SELECT 
    u.uid as id_tecnico,
    u.nombre as nombre_tecnico,
    COUNT(c.id_calificacion) as total_calificaciones,
    ROUND(AVG(c.calificacion)::numeric, 1) as promedio_calificacion,
    COUNT(CASE WHEN c.calificacion >= 4 THEN 1 END) as calificaciones_positivas,
    COUNT(CASE WHEN c.calificacion <= 2 THEN 1 END) as calificaciones_negativas
FROM usuarios u
LEFT JOIN calificaciones_tecnicos c ON u.uid = c.id_tecnico
WHERE u.rol IN ('tecnico', 'tecnico_campo')
GROUP BY u.uid, u.nombre;

-- Comentarios para documentación
COMMENT ON TABLE calificaciones_tecnicos IS 'Calificaciones que los beneficiarios otorgan a los técnicos al resolver incidencias';
COMMENT ON COLUMN calificaciones_tecnicos.calificacion IS 'Calificación del 1 al 5 (1=Muy malo, 5=Excelente)';
COMMENT ON COLUMN calificaciones_tecnicos.comentario IS 'Comentario opcional del beneficiario sobre el servicio del técnico';