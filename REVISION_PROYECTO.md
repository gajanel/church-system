# Revisión del proyecto SIGDEM 1.1.0

Revisión inicial: 8 de septiembre de 2026. Actualizada para la versión 1.1.0 el 19 de septiembre de 2026.

## Correcciones realizadas

- Sesiones: se conserva el token de renovación tras el primer cambio de contraseña. Las consultas simultáneas comparten una renovación; una falla temporal de red no borra la sesión y una renovación pendiente no revierte un cierre de sesión.
- Cuentas: las cuentas desactivadas no pueden usar ni renovar tokens. Un administrador común no puede crear administradores ni modificar o desactivar un súper administrador. Se impide desactivar la cuenta propia desde la ruta de eliminación.
- Navegación: los súper administradores reciben el mismo acceso general que los administradores.
- Inicio: una consulta fallida muestra un error y permite reintentar, en lugar de dejar una carga indefinida. Se elimina una consulta de ingresos que no se utilizaba.
- Ministerios: se importa la función de eliminación de asistencia que faltaba y se muestran los errores al cargar una sección.
- Servidor: el entorno se lee después de cargar .env; los archivos solicitados al frontend deben permanecer dentro de su carpeta.
- Conexión: la compilación de producción utiliza el mismo origen que la página, incluido HTTPS. Si frontend y API se alojan por separado, configurar VITE_API_BASE_URL al compilar.
- Arranque: iniciar_sistema.bat ejecuta el frontend desde church-frontend.
- Interfaz: acceso sin esferas, degradados ni animaciones decorativas; campos con etiquetas y controles accesibles; indicadores adaptables; accesos de Finanzas, Ministerios, Reportes y Configuración más sobrios; mejora de tablas oscuras y respeto a la preferencia de movimiento reducido. Documento HTML en español.
- Caja: se mueve StatCard fuera del render para evitar recrear su identidad en cada actualización.

## Validación realizada

- Compilación de producción de Vite: correcta.
- Pruebas de sesión: 6 aprobadas. Ejecutar desde church-frontend con node --test tests/api.test.mjs. Utilizan un transporte simulado; no sustituyen pruebas contra la API.
- Sintaxis de Python: 100 archivos de aplicación, migraciones y main.py correctos.
- Navegador: pantalla de acceso revisada en escritorio y a 390 px; validación de campos vacíos comprobada.
- git diff --check: sin errores de espacios.

## Pendientes y límites

La revisión no certifica todo el sistema ni sus cálculos contables. No se modificó la base de datos ni se ejecutaron operaciones financieras.

1. El entorno .venv apunta a un Python de otra cuenta de Windows que ya no existe. Debe recrearse con un Python instalado y backend/requirements.txt antes de validar la API y las migraciones contra una base de pruebas. El Python disponible para esta revisión no contiene las dependencias de la API.
2. ESLint todavía informa 58 errores y 15 advertencias, principalmente variables sin uso, sincronización de estado en efectos y exportaciones mixtas de componentes/utilidades. No se desactivaron reglas para ocultarlos. Se corrigieron la referencia inexistente de asistencia y la recreación de StatCard detectadas por esta revisión.
3. Deben probarse con usuarios de cada rol los flujos completos de miembros, finanzas, ministerios, respaldos y cambio de contraseña. La pantalla de inicio solicita datos de varios módulos y un usuario sin permiso financiero puede ver el error de carga; requiere definir qué resumen corresponde a cada rol.
4. El alta inicial sigue usando una contraseña predeterminada y la obligación de cambiarla no se aplica de forma general en las rutas del servidor. Conviene reemplazar este mecanismo por un alta inicial configurable y restringir las operaciones hasta completar el cambio.
5. Los indicadores de miembros del inicio cuentan hasta 1000 registros; una congregación mayor requiere estadísticas agregadas en la API.

Se conservaron las modificaciones previas en los archivos de empaquetado y el instalador existente. El instalador ZIP no fue reconstruido; las mejoras están en el código fuente y en church-frontend/dist.
