# 🧪 GUÍA DE TESTING - ELIMINACIÓN SISTEMA RECEPCIÓN

## 📝 **PRUEBAS PARA VERIFICAR QUE TODO FUNCIONA**

### 1. **✅ VERIFICAR ELIMINACIÓN DE TABLAS**
```sql
-- Verificar que las tablas fueron eliminadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%recepcion%';

-- Resultado esperado: Sin resultados (0 filas)
```

### 2. **🏠 CREAR VIVIENDA CON TEMPLATE**
1. **Ir a:** Admin → Gestión de Viviendas → Crear Nueva
2. **Llenar datos básicos:**
   - Proyecto: (seleccionar existente)
   - Dirección: "Test Casa Template"
   - Estado: "planificada"
3. **Seleccionar Template:** Elegir cualquier template activo
4. **Guardar** ✅
5. **Verificar:** Que se cree automáticamente un formulario postventa con items

### 3. **👤 ASIGNAR BENEFICIARIO**
1. **En la vivienda creada:** Hacer clic en "Asignar Beneficiario"
2. **Seleccionar beneficiario** existente
3. **Verificar:** El formulario se actualiza con el UID del beneficiario

### 4. **🚚 ENTREGAR VIVIENDA (SIN FORZAR)**
1. **Cambiar estado** a "entregada" (sin checkbox "Forzar")
2. **Resultado esperado:** ❌ Error: "formulario postventa no revisado/conforme"
3. **Esto confirma** que la nueva validación funciona

### 5. **🚚 ENTREGAR VIVIENDA (FORZANDO)**
1. **Cambiar estado** a "entregada"
2. **✅ Marcar checkbox** "Forzar entrega"
3. **Guardar**
4. **Resultado esperado:** ✅ Se actualiza correctamente

### 6. **🔍 VERIFICAR EN BASE DE DATOS**
```sql
-- Verificar que se creó el formulario postventa
SELECT 
    vpf.id,
    vpf.estado,
    vpf.template_id,
    v.direccion
FROM vivienda_postventa_form vpf
JOIN viviendas v ON vpf.id_vivienda = v.id_vivienda
WHERE v.direccion = 'Test Casa Template';

-- Verificar items del formulario
SELECT 
    vpi.categoria,
    vpi.item,
    vpi.ok,
    vpi.orden
FROM vivienda_postventa_form_item vpi
JOIN vivienda_postventa_form vpf ON vpi.form_id = vpf.id
JOIN viviendas v ON vpf.id_vivienda = v.id_vivienda
WHERE v.direccion = 'Test Casa Template'
ORDER BY vpi.orden;
```

### 7. **🌐 TESTING FRONTEND**
1. **Login como beneficiario** asignado a la vivienda
2. **Ir a:** "Estado de Mi Vivienda"
3. **Verificar:** 
   - No hay errores de consola relacionados con recepción
   - Los datos cargan correctamente
   - No aparecen referencias a "recepción"

### 8. **🔧 TESTING TÉCNICO**
1. **Login como técnico**
2. **Ir a:** Formularios Postventa
3. **Verificar:** Aparece el formulario creado automáticamente
4. **Revisarlo** y marcarlo como "revisado_correcto"
5. **Luego intentar** cambiar estado vivienda a "entregada" sin forzar
6. **Resultado esperado:** ✅ Ahora SÍ permite la entrega

## 🎯 **CHECKLIST DE ÉXITO**

- [ ] Tablas recepción eliminadas de BD
- [ ] Crear vivienda con template funciona
- [ ] Formulario se crea automáticamente
- [ ] Asignar beneficiario actualiza formulario
- [ ] Validación de entrega con postventa funciona
- [ ] Checkbox "Forzar entrega" funciona
- [ ] Frontend beneficiario carga sin errores
- [ ] Frontend técnico puede revisar formularios
- [ ] Proceso completo de entrega funciona

## 🚫 **ERRORES QUE YA NO DEBERÍAN APARECER**

- ❌ "relation vivienda_recepcion does not exist"
- ❌ "vista_recepcion_resumen does not exist" 
- ❌ Referencias a recepción en consola frontend
- ❌ APIs 404 de endpoints recepción

## ✅ **TODO FUNCIONANDO = ÉXITO TOTAL**