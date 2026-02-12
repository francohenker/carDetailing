# Guía de Extensión y Mantenimiento de Tests

## Tabla de contenidos
- [Agregar nuevos tests](#agregar-nuevos-tests)
- [Actualizar selectores](#actualizar-selectores)
- [Mantenimiento de tests](#mantenimiento-de-tests)
- [Debugging](#debugging)
- [Mejoras futuras](#mejoras-futuras)

## Agregar nuevos tests

### Patrón básico

```javascript
async testMyNewFeature() {
  console.log('\n=== Test: My New Feature ===');
  try {
    // Tu código de test
    
    this.results.passed++;
    console.log('✓ Test passed');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    this.results.failed++;
    this.results.errors.push({
      test: 'testMyNewFeature',
      error: error.message,
    });
    await this.utils.takeScreenshot('error-my-new-feature');
    return false;
  }
}

// En runAllTests(), agregar:
await this.testMyNewFeature();
```

### Ejemplo: Test para modificar un turno

```javascript
async testModifyBooking() {
  console.log('\n=== Test: Modify Booking ===');
  try {
    // 1. Crear una reserva
    await this.completeBooking();
    
    // 2. Navegar al perfil del usuario
    await this.utils.navigateTo(`${config.baseUrl}/user/profile`);
    await this.utils.waitForPageLoad();
    
    // 3. Buscar el turno
    const turnoCards = await this.driver.findElements(By.css('[data-testid="turno-card"]'));
    if (turnoCards.length === 0) throw new Error('No bookings found');
    
    // 4. Click en editar
    const editButton = await this.driver.findElement(By.xpath('//button[contains(text(), "Editar")]'));
    await editButton.click();
    await this.utils.delay(1000);
    
    // 5. Cambiar servicios
    const services = await this.driver.findElements(By.css('[role="checkbox"]'));
    if (services.length > 0) {
      await services[0].click();
    }
    
    // 6. Guardar
    const saveButton = await this.driver.findElement(By.xpath('//button[contains(text(), "Guardar")]'));
    await saveButton.click();
    
    this.results.passed++;
    return true;
  } catch (error) {
    // manejo de error...
  }
}
```

## Actualizar selectores

Cuando cambies la UI, necesitarás actualizar los selectores.

### Ubicación de selectores

1. **`locators.js`** - Selectores principales por funcionalidad
2. **Dentro de tests** - Selectores inline como fallback

### Cómo actualizar selectores

1. Abre DevTools en el navegador (F12)
2. Inspeccioná el elemento que cambió
3. Actualiza el selector en `locators.js`

**Antes:**
```javascript
vehicleCards: By.css('[data-testid="vehicle-card"], .vehicle-select'),
```

**Después:**
```javascript
vehicleCards: By.css('[data-testid="vehicle-card"], .vehicle-select, [class*="vehicle-card"]'),
```

### Ejemplo: Actualizar selector de botón

```javascript
// Viejo selector
nextButton: By.xpath('//button[contains(text(), "Siguiente")]'),

// Nuevo selector (más robusto)
nextButton: By.xpath('//button[contains(text(), "Siguiente") or contains(text(), "Continuar") or contains(text(), "Next") or @data-testid="next-button"]'),
```

## Mantenimiento de tests

### Checklist mensual

- [ ] Ejecutar todos los tests
- [ ] Revisar que pasen
- [ ] Actualizar documentación si hay cambios
- [ ] Revisar timeouts (¿son suficientes?)
- [ ] Limpiar screenshots antiguos
- [ ] Actualizar datos de prueba si es necesario

### Cuando algo falla

1. **Anotar el error**
   ```bash
   LOG_VERBOSE=true SCREENSHOTS=true npm run test:selenium:turno
   ```

2. **Revisar screenshots**
   ```bash
   ls -la frontend/selenium/screenshots/
   ```

3. **Actualizar selectores si es necesario**
   ```javascript
   // En locators.js o en el test
   ```

4. **Ejecutar nuevamente**
   ```bash
   npm run test:selenium:turno
   ```

### Versioning

Mantén un log de cambios en `CHANGELOG.md`:

```markdown
## [2024-02-03] v1.1.0
- Agregar test para modificar turno
- Actualizar selectores de vehículos
- Mejorar tiempo de espera para calendario
- Correción: validación de precio total

## [2024-02-01] v1.0.0
- Release inicial
- Tests básicos de flujo
- Tests avanzados
```

## Debugging

### Modo interactivo

```bash
HEADLESS=false npm run test:selenium:turno
```

Esto abre el navegador para que puedas ver qué está pasando.

### Logs detallados

```bash
LOG_VERBOSE=true npm run test:selenium:turno 2>&1 | tee test-log.txt
```

### Pauser en medio del test

Agregar en tu test:

```javascript
// Pausa el test por 30 segundos
await this.utils.delay(30000);
```

O ejecutar con pausa manual:

```javascript
// En utils.js o en el test
await this.driver.executeScript(`
  debugger; // Se pausará si DevTools está abierto
`);
```

### Inspeccionar elemento

```javascript
// Ver qué elementos encontró
const elements = await this.driver.findElements(By.css('.vehicle-select'));
console.log('Elements found:', elements.length);

for (let el of elements) {
  const text = await el.getText();
  console.log('Element text:', text);
}
```

## Mejoras futuras

### 1. Agregar tests de pago

```javascript
async testPaymentFlow() {
  // Completar reserva
  // Navegar a pago
  // Seleccionar método de pago
  // Confirmar pago
  // Verificar confirmación
}
```

### 2. Tests con múltiples navegadores

```bash
BROWSER=chrome npm run test:selenium:turno
BROWSER=firefox npm run test:selenium:turno
BROWSER=edge npm run test:selenium:turno
```

### 3. Pruebas de carga (load testing)

```javascript
async testMultipleSimultaneousBookings() {
  // Simular múltiples usuarios agendando al mismo tiempo
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(this.completeBooking());
  }
  await Promise.all(promises);
}
```

### 4. Tests de accesibilidad

```javascript
async testAccessibility() {
  // Verificar contraste de colores
  // Verificar navegación con teclado
  // Verificar ARIA labels
  const axe = require('axe-core');
  // ...
}
```

### 5. Tests de rendimiento

```javascript
async testPerformance() {
  const startTime = Date.now();
  // Completar booking
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  console.log(`Booking completed in ${duration}ms`);
  
  if (duration > 10000) { // 10 segundos
    console.warn('Performance warning: took too long');
  }
}
```

### 6. Integración con Applitools Eyes (visual testing)

```javascript
const { Eyes } = require('@applitools/eyes-webdriverio');
const eyes = new Eyes();

async testWithVisualValidation() {
  await eyes.open(this.driver, 'Car Detailing', 'Booking Flow');
  
  // ... realizar acciones ...
  
  await eyes.checkWindow('Confirmation page');
  
  await eyes.close();
}
```

## Scripts útiles

### Ejecutar y guardar log

```bash
#!/bin/bash
npm run test:selenium:turno 2>&1 | tee "logs/test-$(date +%Y%m%d-%H%M%S).log"
```

### Ejecutar con reintento automático

```bash
#!/bin/bash
MAX_ATTEMPTS=3
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Intento $ATTEMPT de $MAX_ATTEMPTS"
  if npm run test:selenium:turno; then
    echo "✓ Tests pasaron"
    exit 0
  fi
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -le $MAX_ATTEMPTS ]; then
    echo "Reintentando en 5 segundos..."
    sleep 5
  fi
done

echo "✗ Tests fallaron después de $MAX_ATTEMPTS intentos"
exit 1
```

### Limpiar screenshots antiguos

```bash
#!/bin/bash
find frontend/selenium/screenshots -type f -mtime +7 -delete
# Elimina screenshots más antiguos de 7 días
```

## Recursos útiles

- [Selenium WebDriver Docs](https://www.selenium.dev/webdriver/)
- [MDN: Testing](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing)
- [Testing Library](https://testing-library.com/)
- [Cypress (alternativa)](https://cypress.io/)

## Preguntas frecuentes

**P: ¿Cómo esperar a un elemento que aparece con animación?**
```javascript
await this.utils.waitForElementVisible(locator, 15000); // 15 segundos
```

**P: ¿Cómo hacer click en un elemento que se mueve?**
```javascript
await this.utils.scrollToElement(locator);
await this.utils.click(locator);
```

**P: ¿Cómo obtener texto con saltos de línea?**
```javascript
const text = await element.getText();
const lines = text.split('\n');
```

**P: ¿Cómo hacer acciones con teclado?**
```javascript
const { Key } = require('selenium-webdriver');
await element.sendKeys(Key.ESCAPE); // Presionar Escape
await element.sendKeys(Key.ENTER);  // Presionar Enter
```

---

**Última actualización**: Febrero 2024
**Mantenedor**: Tu nombre aquí
**Contacto**: email@example.com
