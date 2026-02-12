# Pruebas de Selenium - Agendar Turno

Este directorio contiene pruebas automatizadas con Selenium WebDriver para el flujo de agendar un turno en la aplicación de Car Detailing.

## Requisitos previos

- Node.js 14+ instalado
- npm o yarn como gestor de paquetes
- Selenium WebDriver y ChromeDriver (se instalan automáticamente con npm)
- La aplicación frontend ejecutándose en `http://localhost:3000`
- El backend ejecutándose en `http://localhost:3001`

## Instalación

1. Instalar dependencias del proyecto:
```bash
npm install
```

Esto instalará `selenium-webdriver` que es necesario para ejecutar los tests.

## Configuración

Editar el archivo `config.js` para configurar:

- **baseUrl**: URL de la aplicación (default: `http://localhost:3000`)
- **backendUrl**: URL del API backend (default: `http://localhost:3001`)
- **browser.type**: Tipo de navegador (`chrome`, `firefox`, `edge`) - default: `chrome`
- **browser.headless**: Ejecutar en modo headless sin interfaz gráfica (default: `true`)
- **testUser**: Credenciales del usuario de prueba
- **testCar**: Datos del vehículo para pruebas
- **delays**: Delays entre acciones para simular comportamiento humano
- **log.screenshots**: Tomar screenshots en cada paso (default: `false`)

### Variables de entorno

Puedes configurar los siguientes variables de entorno:

```bash
# URL de la aplicación
FRONTEND_URL=http://localhost:3000

# URL del backend
BACKEND_URL=http://localhost:3001

# Tipo de navegador
BROWSER=chrome

# Modo headless (true/false)
HEADLESS=true

# Email y password del usuario de prueba
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123

# Habilitar logs verbosos
LOG_VERBOSE=true

# Tomar screenshots
SCREENSHOTS=true
```

## Ejecutar pruebas

### Ejecutar todos los tests
```bash
npm run test:selenium
```

### Ejecutar solo pruebas de turno
```bash
npm run test:selenium:turno
```

### Con variables de entorno
```bash
HEADLESS=false SCREENSHOTS=true npm run test:selenium
```

## Estructura de archivos

```
selenium/
├── config.js           # Configuración centralizada
├── utils.js            # Utilidades compartidas para los tests
├── turno.test.js       # Tests para el flujo de agendar turno
├── run-tests.js        # Script principal de ejecución
├── README.md           # Este archivo
└── screenshots/        # Carpeta para guardar screenshots (se crea automáticamente)
```

## Casos de prueba implementados

### 1. Flujo completo de agendar turno (testCompleteBookingFlow)
Prueba el flujo completo paso a paso:
- Navega a `/turno`
- Selecciona un vehículo
- Selecciona servicios
- Selecciona fecha
- Selecciona horario
- Confirma la reserva
- Verifica redirección a `/user/profile`

**Pasos del test:**
1. Cargar página de turno
2. Seleccionar vehículo (Paso 1)
3. Avanzar a servicios (Paso 2)
4. Seleccionar servicios
5. Avanzar a fecha/hora (Paso 3)
6. Seleccionar fecha
7. Seleccionar horario
8. Avanzar a confirmación (Paso 4)
9. Verificar resumen
10. Confirmar reserva
11. Verificar redirección

### 2. Validaciones del formulario (testFormValidations)
Prueba que las validaciones funcionan correctamente:
- Verificar que no se puede avanzar sin seleccionar vehículo
- Validar que los campos requeridos se validen

### 3. Navegación hacia atrás (testBackNavigation)
Prueba la funcionalidad de volver atrás:
- Seleccionar vehículo
- Avanzar al siguiente paso
- Volver atrás
- Verificar que vuelve al paso anterior

## Utilidades disponibles

La clase `TestUtils` proporciona métodos auxiliares:

```javascript
// Esperaciones
await utils.waitForElement(locator, timeout)
await utils.waitForElementVisible(locator, timeout)
await utils.waitForPageLoad(timeout)
await utils.waitForUrlContains(text, timeout)

// Interacciones
await utils.click(locator, withDelay)
await utils.sendKeys(locator, text, clear)
await utils.scrollToElement(locator)
await utils.moveToElement(locator)

// Obtener datos
await utils.getText(locator)
await utils.getAttribute(locator, attribute)

// Utilidades
await utils.delay(ms)
await utils.executeScript(script, ...args)
await utils.takeScreenshot(filename)
await utils.navigateTo(url)
await utils.isElementPresent(locator)

// LocalStorage
await utils.setJWT(token)
await utils.getJWT()
await utils.clearLocalStorage()
```

## Selectores utilizados

Los tests buscan elementos por varios métodos:

1. **data-testid**: Atributo específico para tests
2. **Clases CSS**: Patrones comunes como `vehicle-select`, `service-card`, etc.
3. **Rol ARIA**: Búsqueda por `role="button"`, `role="checkbox"`, etc.
4. **Atributos genéricos**: `class*="turno"`, `class*="step"`, etc.

### Ejemplo de selectores esperados

Para que los tests funcionen óptimamente, la aplicación debe tener elementos con:

```html
<!-- Vehículos -->
<div data-testid="vehicle-card">...</div>
<!-- o -->
<div class="vehicle-select">...</div>

<!-- Servicios -->
<div data-testid="service-item">...</div>
<!-- o -->
<div role="checkbox" class="service-card">...</div>

<!-- Horarios -->
<div data-testid="time-slot">...</div>
<!-- o -->
<button class="slot">...</button>

<!-- Botones de navegación -->
<button>Siguiente</button>
<button>Confirmar Reserva</button>
```

## Troubleshooting

### Los tests no encuentran elementos
1. Verificar que los selectores son correctos
2. Aumentar los timeouts en `config.js`
3. Ejecutar con `LOG_VERBOSE=true` para más información
4. Habilitar `SCREENSHOTS=true` para ver qué ve el driver

### Los tests fallan en la selección de fecha
- El calendario puede tener diferentes selectores según el componente
- Los tests intentan múltiples estrategias de búsqueda
- Si falla, revisar el HTML del calendario en DevTools

### Problemas con el driver de Chrome
1. Asegurar que ChromeDriver es compatible con la versión de Chrome
2. Instalar con: `npm install chromedriver --save-dev`
3. Verificar permisos de ejecución en Linux/Mac

### Tests passan pero dicen que fallaron
- Revisar el número de tests pasados/fallidos en el resumen
- Los screenshots se guardan en `selenium/screenshots/`
- Revisar los logs para más detalles

## Mejores prácticas

1. **Siempre usar delays**: Los delays ayudan a simular comportamiento humano
2. **Tomar screenshots**: Útil para debugging
3. **Usar data-testid**: Más confiable que buscar por clases CSS
4. **Esperar explícitamente**: No usar delays sin necesidad, usar waitFor
5. **Logs claros**: Describir qué está haciendo cada paso
6. **Limpiar después**: Asegurar que teardown se ejecute siempre

## Extender los tests

Para agregar nuevos tests:

```javascript
async testMyFeature() {
  console.log('\n=== Test: My Feature ===');
  try {
    // Tu código de test
    this.results.passed++;
    console.log('✓ Test passed');
    return true;
  } catch (error) {
    this.results.failed++;
    this.results.errors.push({
      test: 'testMyFeature',
      error: error.message,
    });
    return false;
  }
}

// Agregar en runAllTests():
await this.testMyFeature();
```

## Integración continua

Para ejecutar en CI/CD (GitHub Actions, GitLab CI, etc.):

```bash
# En modo headless (sin interfaz gráfica)
HEADLESS=true npm run test:selenium

# Con captura de pantallas en caso de error
SCREENSHOTS=true npm run test:selenium
```

## Información adicional

- [Documentación de Selenium WebDriver](https://www.selenium.dev/webdriver/)
- [Locators en Selenium](https://www.selenium.dev/documentation/webdriver/elements/locators/)
- [Waits en Selenium](https://www.selenium.dev/documentation/webdriver/waits/)

## Contacto y soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio del proyecto.
