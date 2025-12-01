-- Migración: Actualizar estados permitidos en viviendas
-- Fecha: 2025-11-28
-- Descripción: Permitir estados de entrega incluyendo entregada_inicial, entregada_definitiva y entregada

-- Verificar y eliminar restricciones existentes conflictivas
DO $$
DECLARE
    constraint_record record;
BEGIN
    -- Buscar y eliminar constraints que limiten los estados
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'viviendas' 
        AND constraint_name LIKE '%estado%'
        AND check_clause NOT LIKE '%entregada_inicial%'
    LOOP
        EXECUTE 'ALTER TABLE viviendas DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- Agregar la restricción correcta con todos los estados
ALTER TABLE viviendas 
ADD CONSTRAINT chk_viviendas_estado_completo
CHECK (estado IN (
    'planificada',
    'en_construccion', 
    'construida',
    'lista_para_entregar',
    'asignada',
    'entregada_inicial',
    'entregada_definitiva',
    'entregada'
));