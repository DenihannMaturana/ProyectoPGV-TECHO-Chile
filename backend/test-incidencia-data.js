import { supabase } from './supabaseClient.js';

async function testIncidenciaData() {
  try {
    console.log('Probando datos de incidencias para beneficiario...\n');
    
    // Buscar un beneficiario que tenga incidencias resueltas
    console.log('1. Buscando incidencias con técnico asignado...');
    const { data: incidencias, error: errorInc } = await supabase
      .from('incidencias')
      .select(`
        id_incidencia,
        estado,
        categoria,
        descripcion,
        id_usuario_reporta,
        id_usuario_tecnico,
        tecnico:usuarios!incidencias_id_usuario_tecnico_fkey(uid,nombre,email),
        viviendas(id_vivienda,direccion, proyecto(nombre))
      `)
      .eq('estado', 'resuelta')
      .not('id_usuario_tecnico', 'is', null)
      .limit(3);
    
    if (errorInc) {
      console.error('Error obteniendo incidencias:', errorInc);
      return;
    }
    
    console.log(`Encontradas ${incidencias?.length || 0} incidencias resueltas con técnico`);
    
    if (incidencias && incidencias.length > 0) {
      incidencias.forEach(inc => {
        console.log(`\nIncidencia ${inc.id_incidencia}:`);
        console.log(`  - Estado: ${inc.estado}`);
        console.log(`  - Beneficiario ID: ${inc.id_usuario_reporta}`);
        console.log(`  - Técnico ID: ${inc.id_usuario_tecnico}`);
        console.log(`  - Técnico info:`, inc.tecnico);
        console.log(`  - Vivienda:`, inc.viviendas?.direccion);
      });
      
      // Probar API de beneficiario específico
      const beneficiarioId = incidencias[0].id_usuario_reporta;
      console.log(`\n2. Simulando API call para beneficiario ${beneficiarioId}:`);
      
      const { data: incidenciasBenef, error: errorBenef } = await supabase
        .from('incidencias')
        .select(`*, viviendas(id_vivienda,direccion, proyecto(nombre)), tecnico:usuarios!incidencias_id_usuario_tecnico_fkey(uid,nombre,email)`)
        .eq('id_usuario_reporta', beneficiarioId)
        .order('fecha_reporte', { ascending:false })
        .limit(5);
      
      if (errorBenef) {
        console.error('Error con API beneficiario:', errorBenef);
      } else {
        console.log(`Incidencias del beneficiario: ${incidenciasBenef?.length || 0}`);
        incidenciasBenef?.forEach(inc => {
          console.log(`  - ${inc.id_incidencia}: ${inc.estado} - Técnico: ${inc.tecnico?.nombre || 'Sin técnico'} (ID: ${inc.tecnico?.uid || 'N/A'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testIncidenciaData().then(() => {
  console.log('\nTest completado');
  process.exit(0);
});