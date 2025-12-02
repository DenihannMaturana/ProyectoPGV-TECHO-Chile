/**
 * Script para gestión de retención de logs de auditoría
 * 
 * Este script proporciona funciones para:
 * 1. Archivar logs antiguos
 * 2. Eliminar logs después de cierto periodo
 * 3. Generar reportes de logs antes de eliminarlos
 * 
 * IMPORTANTE: Actualmente la tabla audit_log NO tiene retención automática.
 * Los logs se guardan para siempre. Este script es OPCIONAL y debe configurarse
 * según políticas de la organización.
 */

import { supabase } from '../supabaseClient.js';
import fs from 'fs';
import path from 'path';

/**
 * Configuración de retención (personalizable)
 */
const RETENTION_CONFIG = {
  // Días a mantener en la tabla principal
  DAYS_TO_KEEP: 365, // 1 año por defecto
  
  // Crear backup antes de eliminar
  CREATE_BACKUP: true,
  
  // Directorio para backups
  BACKUP_DIR: './audit_backups',
};

/**
 * Obtiene logs antiguos que exceden el periodo de retención
 */
async function getOldLogs(daysToKeep = RETENTION_CONFIG.DAYS_TO_KEEP) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error obteniendo logs antiguos:', error);
    throw error;
  }

  return data;
}

/**
 * Crea un backup de logs en formato JSON
 */
async function backupLogs(logs, filename) {
  if (!RETENTION_CONFIG.CREATE_BACKUP) {
    console.log('Backup deshabilitado en configuración');
    return;
  }

  // Crear directorio si no existe
  if (!fs.existsSync(RETENTION_CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(RETENTION_CONFIG.BACKUP_DIR, { recursive: true });
  }

  const filepath = path.join(RETENTION_CONFIG.BACKUP_DIR, filename);
  
  const backupData = {
    backup_date: new Date().toISOString(),
    total_records: logs.length,
    date_range: {
      from: logs[0]?.created_at,
      to: logs[logs.length - 1]?.created_at
    },
    logs: logs
  };

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  console.log(`Backup creado: ${filepath}`);
  console.log(`Registros respaldados: ${logs.length}`);
  
  return filepath;
}

/**
 * Elimina logs antiguos de la base de datos
 */
async function deleteOldLogs(daysToKeep = RETENTION_CONFIG.DAYS_TO_KEEP) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabase
    .from('audit_log')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select();

  if (error) {
    console.error('Error eliminando logs antiguos:', error);
    throw error;
  }

  console.log(`Logs eliminados: ${data?.length || 0}`);
  return data?.length || 0;
}

/**
 * Genera un reporte resumido de los logs a eliminar
 */
function generateSummaryReport(logs) {
  const summary = {
    total: logs.length,
    by_action: {},
    by_user: {},
    date_range: {
      oldest: logs[0]?.created_at,
      newest: logs[logs.length - 1]?.created_at
    }
  };

  logs.forEach(log => {
    // Contar por acción
    summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
    
    // Contar por usuario
    const user = log.actor_email || 'unknown';
    summary.by_user[user] = (summary.by_user[user] || 0) + 1;
  });

  return summary;
}

/**
 * Función principal de limpieza con retención
 */
async function cleanupAuditLogs(options = {}) {
  const daysToKeep = options.daysToKeep || RETENTION_CONFIG.DAYS_TO_KEEP;
  const dryRun = options.dryRun || false;

  console.log('Iniciando limpieza de logs de auditoría...');
  console.log(`Retención configurada: ${daysToKeep} días`);
  console.log(`Modo: ${dryRun ? 'DRY RUN (sin cambios)' : 'PRODUCCIÓN'}`);

  try {
    // 1. Obtener logs antiguos
    console.log('\n1. Obteniendo logs antiguos...');
    const oldLogs = await getOldLogs(daysToKeep);
    
    if (oldLogs.length === 0) {
      console.log('No hay logs antiguos para eliminar');
      return { deleted: 0, backed_up: 0 };
    }

    console.log(`Logs encontrados: ${oldLogs.length}`);

    // 2. Generar reporte
    console.log('\n2. Generando reporte...');
    const summary = generateSummaryReport(oldLogs);
    console.log('Resumen:', JSON.stringify(summary, null, 2));

    // 3. Crear backup
    console.log('\n3. Creando backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `audit_log_backup_${timestamp}.json`;
    await backupLogs(oldLogs, backupFile);

    // 4. Eliminar logs (solo si no es dry run)
    if (!dryRun) {
      console.log('\n4. Eliminando logs de la base de datos...');
      const deletedCount = await deleteOldLogs(daysToKeep);
      console.log(`Proceso completado. Logs eliminados: ${deletedCount}`);
      
      return { deleted: deletedCount, backed_up: oldLogs.length };
    } else {
      console.log('\nDRY RUN: No se eliminaron logs de la base de datos');
      return { deleted: 0, backed_up: oldLogs.length, would_delete: oldLogs.length };
    }

  } catch (error) {
    console.error('Error durante la limpieza:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de almacenamiento
 */
async function getStorageStats() {
  try {
    // Total de logs
    const { count: totalLogs } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true });

    // Log más antiguo
    const { data: oldest } = await supabase
      .from('audit_log')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Log más reciente
    const { data: newest } = await supabase
      .from('audit_log')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const stats = {
      total_logs: totalLogs || 0,
      oldest_log: oldest?.created_at,
      newest_log: newest?.created_at,
      retention_days: oldest ? Math.floor((new Date() - new Date(oldest.created_at)) / (1000 * 60 * 60 * 24)) : 0
    };

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const showStats = args.includes('--stats');

  if (showStats) {
    console.log('Estadísticas de almacenamiento de audit_log:\n');
    getStorageStats().then(stats => {
      console.log(JSON.stringify(stats, null, 2));
      console.log(`\nLos logs más antiguos tienen ${stats.retention_days} días`);
    });
  } else {
    cleanupAuditLogs({ dryRun })
      .then(result => {
        console.log('\nProceso finalizado:', result);
        process.exit(0);
      })
      .catch(error => {
        console.error('\nError:', error);
        process.exit(1);
      });
  }
}

export {
  cleanupAuditLogs,
  getOldLogs,
  backupLogs,
  deleteOldLogs,
  getStorageStats,
  RETENTION_CONFIG
};
