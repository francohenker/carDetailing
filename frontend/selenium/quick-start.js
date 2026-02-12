#!/usr/bin/env node

/**
 * GUÍA RÁPIDA DE USO - TESTS DE SELENIUM PARA AGENDAR TURNO
 * 
 * Este archivo contiene instrucciones rápidas para empezar con los tests
 */

const fs = require('fs');
const path = require('path');

const quickStartGuide = `
╔════════════════════════════════════════════════════════════════════════════╗
║              TESTS DE SELENIUM - CAR DETAILING (AGENDAR TURNO)             ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 RESUMEN RÁPIDO
═════════════════════════════════════════════════════════════════════════════

Los tests de Selenium cubren el flujo completo de agendar un turno en la 
aplicación de Car Detailing. Incluyen:

✓ Flujo completo: vehículo → servicios → fecha → hora → confirmación
✓ Validaciones del formulario
✓ Navegación hacia atrás y adelante
✓ Cálculo de precios
✓ Disponibilidad de horarios
✓ Manejo de errores

═════════════════════════════════════════════════════════════════════════════

🚀 EMPEZAR EN 5 MINUTOS
═════════════════════════════════════════════════════════════════════════════

1. INSTALAR DEPENDENCIAS
   $ npm install

2. ASEGURAR QUE LAS APLICACIONES ESTÉN CORRIENDO
   - Frontend (Next.js): http://localhost:3000
     $ npm run dev
   
   - Backend (NestJS): http://localhost:3001
     En otra terminal en /backend:
     $ npm run start

3. EJECUTAR LOS TESTS
   # Tests básicos de flujo
   $ npm run test:selenium:turno
   
   # Tests avanzados
   $ npm run test:selenium:advanced
   
   # Todos los tests
   $ npm run test:selenium

4. VER RESULTADOS
   Los tests mostrarán:
   - ✓ para tests pasados
   - ✗ para tests fallados
   - Screenshots de cada paso (si SCREENSHOTS=true)

═════════════════════════════════════════════════════════════════════════════

📁 ESTRUCTURA DE ARCHIVOS
═════════════════════════════════════════════════════════════════════════════

frontend/selenium/
├── config.js                    Configuración centralizada
├── utils.js                     Funciones de utilidad (click, sendKeys, etc.)
├── locators.js                  Selectores CSS/XPath
├── test-data.js                 Datos de prueba
├── turno.test.js               Tests básicos del flujo de turno
├── advanced.test.js            Tests avanzados (cambios, precios, etc.)
├── run-tests.js                Script principal
├── run-ci.sh                   Script para CI/CD
├── github-actions-workflow.yml Configuración para GitHub Actions
├── README.md                    Documentación completa
└── screenshots/                Capturas de pantalla (se crean automáticamente)

═════════════════════════════════════════════════════════════════════════════

⚙️ CONFIGURACIÓN
═════════════════════════════════════════════════════════════════════════════

Editar frontend/selenium/config.js para cambiar:

- FRONTEND_URL: http://localhost:3000
- BACKEND_URL: http://localhost:3001
- BROWSER: 'chrome', 'firefox', 'edge'
- HEADLESS: true/false (sin/con interfaz gráfica)
- SCREENSHOTS: true/false (capturar pantallas)
- TIMEOUTS: tiempo de espera para elementos

Variables de entorno:

FRONTEND_URL=http://localhost:3000 \\
SCREENSHOTS=true \\
npm run test:selenium:turno

═════════════════════════════════════════════════════════════════════════════

🧪 TESTS DISPONIBLES
═════════════════════════════════════════════════════════════════════════════

TESTS BÁSICOS (turno.test.js):
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. testCompleteBookingFlow                                              │
│    - Flujo completo desde seleccionar vehículo hasta confirmación        │
│    - Verifica que el usuario es redirigido a /user/profile              │
│    - Incluye screenshots de cada paso                                   │
│                                                                          │
│ 2. testFormValidations                                                  │
│    - Verifica que las validaciones funcionan                            │
│    - No permitir avanzar sin vehículo seleccionado                      │
│                                                                          │
│ 3. testBackNavigation                                                   │
│    - Seleccionar vehículo → avanzar → retroceder                       │
│    - Verificar que se vuelve al paso anterior                          │
└─────────────────────────────────────────────────────────────────────────┘

TESTS AVANZADOS (advanced.test.js):
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. testVehicleChangeInFlow                                              │
│    - Seleccionar un vehículo, avanzar, volver y cambiar                │
│                                                                          │
│ 2. testServiceChangeInFlow                                              │
│    - Cambiar la selección de servicios                                 │
│    - Verificar selección múltiple                                       │
│                                                                          │
│ 3. testPriceCalculation                                                 │
│    - Verificar cálculo correcto de precios                             │
│                                                                          │
│ 4. testTimeSlotAvailability                                             │
│    - Contar horarios disponibles                                        │
│    - Verificar que existen slots sin disponibilidad                     │
│                                                                          │
│ 5. testRequiredFields                                                   │
│    - Verificar que los campos requeridos son obligatorios               │
│    - Botón "Siguiente" deshabilitado sin datos                          │
└─────────────────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════════════════

📸 SCREENSHOTS
═════════════════════════════════════════════════════════════════════════════

Los screenshots se guardan en: frontend/selenium/screenshots/

Con nombres como:
- 01-turno-page-loaded.png       Página cargada
- 02-vehicle-selected.png        Vehículo seleccionado
- 03-services-step.png           Paso de servicios
- 04-services-selected.png       Servicios seleccionados
- 05-datetime-step.png           Paso de fecha/hora
- 06-date-selected.png           Fecha seleccionada
- 07-time-selected.png           Hora seleccionada
- 08-confirmation-step.png       Paso de confirmación
- 09-summary-verified.png        Resumen verificado
- 10-booking-confirmed.png       Reserva confirmada
- 11-redirected-to-profile.png   Redirigido a perfil

Para habilitar screenshots:
SCREENSHOTS=true npm run test:selenium:turno

═════════════════════════════════════════════════════════════════════════════

🔧 TROUBLESHOOTING
═════════════════════════════════════════════════════════════════════════════

PROBLEMA: "Element not found"
SOLUCIÓN: 
- Verificar que los selectores son correctos
- Usar LOG_VERBOSE=true para más información
- Habilitar SCREENSHOTS=true para ver qué ve Selenium

PROBLEMA: "Timeout waiting for element"
SOLUCIÓN:
- Aumentar timeouts en config.js
- Verificar que la aplicación está corriendo
- Comprobar que la aplicación cargó completamente

PROBLEMA: "Connection refused"
SOLUCIÓN:
- Verificar que Frontend corre en http://localhost:3000
- Verificar que Backend corre en http://localhost:3001
- Ejecutar "npm run dev" desde la carpeta frontend
- Ejecutar "npm run start" desde la carpeta backend

PROBLEMA: Tests en modo headless fallan pero funcionan con interfaz
SOLUCIÓN:
- Ejecutar con HEADLESS=false para debugging
- Verificar que Chrome/ChromeDriver está instalado
- Reinstalar: npm install --save-dev selenium-webdriver

═════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTACIÓN COMPLETA
═════════════════════════════════════════════════════════════════════════════

Ver frontend/selenium/README.md para:
- Instalación detallada
- Configuración avanzada
- Utilidades disponibles
- Cómo extender tests
- Integración con CI/CD

═════════════════════════════════════════════════════════════════════════════

💡 TIPS Y BUENAS PRÁCTICAS
═════════════════════════════════════════════════════════════════════════════

1. EMPEZAR CON TESTS BÁSICOS
   npm run test:selenium:turno
   
   Una vez que funcionen, ejecutar avanzados:
   npm run test:selenium:advanced

2. USAR LOG_VERBOSE PARA DEBUGGING
   LOG_VERBOSE=true npm run test:selenium:turno

3. HABILITAR SCREENSHOTS EN DESARROLLO
   SCREENSHOTS=true HEADLESS=false npm run test:selenium:turno

4. EJECUTAR EN CI/CD
   Ver github-actions-workflow.yml para configuración de GitHub Actions

5. AGREGAR NUEVOS TESTS
   Crear función en turno.test.js o advanced.test.js
   Seguir el patrón de try/catch y logging

6. USAR data-testid EN COMPONENTES
   Facilita la búsqueda de elementos:
   <div data-testid="vehicle-card">...</div>

═════════════════════════════════════════════════════════════════════════════

📞 SOPORTE
═════════════════════════════════════════════════════════════════════════════

Para reportar problemas:
1. Ejecutar con LOG_VERBOSE=true y SCREENSHOTS=true
2. Guardar screenshots y logs
3. Incluir versión de Node.js: node --version
4. Incluir versión de Chrome: google-chrome --version
5. Crear issue con detalles

═════════════════════════════════════════════════════════════════════════════

✅ CHECKLIST PARA EJECUTAR TESTS
═════════════════════════════════════════════════════════════════════════════

□ Node.js 14+ instalado: node --version
□ npm instalado: npm --version
□ Dependencias instaladas: npm install
□ Frontend corriendo: http://localhost:3000
□ Backend corriendo: http://localhost:3001
□ config.js configurado correctamente
□ Ejecutar tests: npm run test:selenium:turno
□ Revisar resultados y screenshots

═════════════════════════════════════════════════════════════════════════════

¡Listo! Ahora puedes ejecutar los tests de Selenium.

Comienza con:
$ npm run test:selenium:turno

═════════════════════════════════════════════════════════════════════════════
`;

console.log(quickStartGuide);

// Guardar también en un archivo de texto
const guideFile = path.join(__dirname, 'QUICK_START.md');
fs.writeFileSync(guideFile, quickStartGuide.replace(/╔|╚|═|║|┐|┌|┘|└|├|┤|─|┼/g, ''));

console.log(`\n✓ Guía rápida guardada en: ${guideFile}\n`);
