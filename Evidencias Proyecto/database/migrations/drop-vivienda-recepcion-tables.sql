-- ========================================
-- ELIMINACIÓN DE TABLAS OBSOLETAS DE RECEPCIÓN
-- ========================================
-- 
-- Este script elimina las tablas vivienda_recepcion y vivienda_recepcion_item
-- que están siendo reemplazadas por el sistema de templates de postventa
-- 
-- VERIFICADO: Las tablas están vacías al momento de crear este script
-- 
-- Fecha: 2025-11-30
-- Motivo: Redundancia con sistema de templates de postventa
-- 

-- Eliminar índices primero (si existen)
DROP INDEX IF EXISTS idx_recepcion_vivienda;
DROP INDEX IF EXISTS idx_recepcion_beneficiario;
DROP INDEX IF EXISTS idx_recepcion_item_recepcion;

-- Eliminar tablas en orden (items primero por foreign key)
DROP TABLE IF EXISTS vivienda_recepcion_item CASCADE;
DROP TABLE IF EXISTS vivienda_recepcion CASCADE;

-- Confirmar eliminación
SELECT 'Tablas de recepción eliminadas exitosamente' as resultado;