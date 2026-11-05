# Evaluación funcional y preparación para nube

Fecha: 20 de octubre de 2026

## Estado actual

El sistema compila y las pruebas existentes de sesión, miembros, usuarios, asistencia y permisos pasan. La navegación principal está organizada por Inicio, Miembros, Ministerios, Finanzas, Proyectos, Eventos, Privilegios, Anuncios, Asistencia, Reportes y Administración.

## Correcciones aplicadas

- El backend ya no inicia si una migración falla. Esto evita trabajar con una base parcialmente actualizada.
- `/health` responde con estado HTTP 503 cuando PostgreSQL no está disponible.
- Una instalación nueva en producción exige `INITIAL_ADMIN_PASSWORD`; ya no crea silenciosamente `admin/admin123`.
- La consulta de usuarios limita a usuarios normales a su propia cuenta.
- Los cambios del módulo Privilegios requieren un administrador.
- Los permisos de Miembros, Eventos, Proyectos, Asistencia, Finanzas, Reportes y Privilegios se validan en la API y no solamente en la barra lateral.
- Los permisos específicos, como `finance.expenses`, muestran correctamente el grupo principal y no habilitan otras subsecciones.
- Configuración aparece únicamente para administradores.
- La configuración pública devuelve solamente datos de identidad visual e idioma.
- Se eliminó una carga duplicada del historial bancario en Caja General y código sin uso que impedía pasar el análisis estático.
- La sesión se cierra después de 60 minutos sin actividad y muestra un mensaje al volver al acceso. El plazo se configura con `VITE_SESSION_IDLE_MINUTES`.

## Pendientes antes de publicar en nube

### Prioridad alta

1. **Migraciones versionadas:** sustituir la cadena de scripts ejecutada al arrancar por Alembic con revisión, historial y reversión. Las migraciones no deben depender del inicio normal del servidor.
2. **Respaldo y restauración:** el respaldo JSON actual no incluye todas las tablas y la restauración usa `ON CONFLICT DO NOTHING`; por ello no reemplaza realmente registros existentes aunque la interfaz lo indique. Para producción se debe usar `pg_dump`/`pg_restore` y dejar la exportación JSON como intercambio de datos.
3. **Archivos subidos:** fotografías y comprobantes se guardan en `static` local. En nube deben almacenarse en un volumen persistente o almacenamiento de objetos compatible con S3. Un contenedor efímero perdería esos archivos al desplegar de nuevo.
4. **Prueba completa con una copia de producción:** restaurar un respaldo PostgreSQL en un entorno de ensayo, ejecutar todas las migraciones y verificar totales de miembros, asistencia y finanzas antes del despliegue real.

### Prioridad media

1. Corregir las 11 advertencias restantes de dependencias de `useEffect` para evitar cierres obsoletos y recargas inconsistentes.
2. Agregar pruebas de autorización para cada módulo y subsección, incluidas respuestas 401 y 403.
3. Separar las rutas financieras y de reportes en archivos más pequeños para facilitar revisión y mantenimiento.
4. Agregar paginación o carga diferida en selectores de miembros; varios formularios solicitan un máximo fijo de 200 registros.
5. Definir rotación o revocación de refresh tokens para sesiones cerradas, cambios de contraseña y cuentas comprometidas.

## Propuesta de arquitectura en nube

- Backend FastAPI detrás de HTTPS y proxy inverso.
- PostgreSQL administrado con copias automáticas y recuperación a un punto en el tiempo.
- Frontend servido por el mismo dominio o CDN, con `VITE_API_BASE_URL` y `ALLOWED_ORIGINS` definidos para el dominio real.
- Fotografías y documentos en almacenamiento de objetos o volumen persistente.
- Variables sensibles en el gestor de secretos del proveedor, nunca dentro de la imagen ni del repositorio.
- Despliegue primero en un entorno de ensayo y después en producción usando la misma versión de la aplicación.

## Criterios para autorizar el despliegue

- Migración completa ejecutada sobre una copia reciente sin errores.
- Inicio de sesión y cambio obligatorio de contraseña verificados.
- Permisos comprobados con un administrador y al menos dos usuarios limitados.
- Totales financieros y de asistencia comparados antes y después.
- Carga y descarga de fotografías y comprobantes verificada después de reiniciar el servicio.
- Respaldo PostgreSQL restaurado exitosamente en un entorno vacío.
- `/health` responde `healthy` y el monitoreo alerta ante estado 503.
