-- Fix: Corregir tipos de datos en tabla calificaciones_tecnicos
-- Fecha: 2025-12-01
-- Descripción: Cambiar id_tecnico e id_beneficiario de BIGINT a TEXT para coincidir con usuarios.uid

-- Si la tabla existe con tipos incorrectos, recrearla
DO $$ 
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calificaciones_tecnicos') THEN
        -- Eliminar la tabla existente y sus dependencias
        DROP TABLE IF EXISTS calificaciones_tecnicos CASCADE;
        RAISE NOTICE 'Tabla calificaciones_tecnicos eliminada para recreación';
    END IF;
END $$;

-- Recrear tabla con tipos correctos
CREATE TABLE calificaciones_tecnicos (
    id_calificacion BIGSERIAL PRIMARY KEY,
    id_incidencia BIGINT NOT NULL REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
    id_tecnico TEXT NOT NULL REFERENCES usuarios(uid) ON DELETE CASCADE,
    id_beneficiario TEXT NOT NULL REFERENCES usuarios(uid) ON DELETE CASCADE,
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    fecha_calificacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Una calificación por incidencia
    UNIQUE(id_incidencia)
);

-- Índices para optimizar consultas
CREATE INDEX idx_calificaciones_tecnico ON calificaciones_tecnicos(id_tecnico);
CREATE INDEX idx_calificaciones_beneficiario ON calificaciones_tecnicos(id_beneficiario);
CREATE INDEX idx_calificaciones_fecha ON calificaciones_tecnicos(fecha_calificacion);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
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
    COUNT(CASE WHEN c.calificacion >= 4 THEN 1 END) as positivas,
    COUNT(CASE WHEN c.calificacion = 3 THEN 1 END) as neutrales,
    COUNT(CASE WHEN c.calificacion <= 2 THEN 1 END) as negativas
FROM usuarios u
LEFT JOIN calificaciones_tecnicos c ON u.uid = c.id_tecnico
WHERE u.rol IN ('tecnico', 'tecnico_campo')
GROUP BY u.uid, u.nombre;

-- Comentarios para documentación
COMMENT ON TABLE calificaciones_tecnicos IS 'Calificaciones que los beneficiarios otorgan a los técnicos al resolver incidencias';
COMMENT ON COLUMN calificaciones_tecnicos.id_tecnico IS 'UID (TEXT) del técnico calificado';
COMMENT ON COLUMN calificaciones_tecnicos.id_beneficiario IS 'UID (TEXT) del beneficiario que califica';
COMMENT ON COLUMN calificaciones_tecnicos.calificacion IS 'Calificación del 1 al 5 (1=Muy malo, 5=Excelente)';

RAISE NOTICE '✅ Tabla calificaciones_tecnicos recreada correctamente con tipos TEXT para UIDs';
