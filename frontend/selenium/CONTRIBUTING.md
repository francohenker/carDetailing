´# Contribuir a los Tests de Selenium

Este documento explica cómo contribuir mejoras a la suite de tests de Selenium para el flujo de agendar turno.

## Guía de contribución

### 1. Antes de empezar

- Lee [README.md](./README.md) para entender la estructura
- Revisa [MAINTENANCE.md](./MAINTENANCE.md) para patrones y mejores prácticas
- Ejecuta los tests existentes para asegurar que funcionan

### 2. Tipos de contribuciones

#### A. Correción de bugs en tests

Si encuentras un test que falla:

1. Crea una rama: `git checkout -b fix/descripcion-del-bug`
2. Identifica la causa (puede ser cambio en UI, timeout insuficiente, etc.)
3. Aplica la correción
4. Ejecuta los tests para verificar
5. Actualiza la documentación si es necesario
6. Envía un PR con descripción clara

#### B. Agregar nuevos tests

Para agregar un test nuevo:

1. Crea una rama: `git checkout -b feature/nuevo-test`
2. Agrega el test en el archivo correspondiente:
   - `turno.test.js` para flujos básicos
   - `advanced.test.js` para casos avanzados
3. Sigue el patrón:
   ```javascript
   async testMyFeature() {
     console.log('\n=== Test: My Feature ===');
     try {
       // Tu código
       this.results.passed++;
       return true;
     } catch (error) {
       this.results.failed++;
       // Manejo de error
       return false;
     }
   }
   ```
4. Agrégalo a `runAllTests()`
5. Documenta en los comentarios del código
6. Envía PR

#### C. Mejorar utilidades

Para mejorar `utils.js`:

1. Agrega métodos nuevos si se repiten acciones
2. Mantén compatibilidad hacia atrás
3. Documenta cada método
4. Actualiza `README.md`

#### D. Actualizar selectores

Cuando la UI cambia:

1. Actualiza los selectores en `locators.js`
2. Incluye fallbacks para compatibilidad
3. Prueba todos los tests
4. Documenta el cambio

### 3. Estándares de código

#### Formato

- **Indentación**: 2 espacios
- **Punto y coma**: Obligatorio
- **Comillas**: Simple quotes para strings
- **Variables**: camelCase

```javascript
const myVariable = 'value';
async myFunction() {
  // código
}
```

#### Comentarios

Comenta el propósito, no el código obvio:

```javascript
// BUENO: Explicar por qué
// Esperar a que los horarios carguen antes de proceder
await this.utils.waitForElementVisible(locator, 5000);

// MALO: Redundante
// Hacer click en el botón
button.click();
```

#### Manejo de errores

Siempre captura errores con contexto:

```javascript
try {
  // acciones
} catch (error) {
  throw new Error(`Descripción clara: ${error.message}`);
}
```

### 4. Testing tu contribución

Antes de enviar un PR:

```bash
# Instalar dependencias
npm install

# Ejecutar todos los tests
npm run test:selenium

# Con modo verbose
LOG_VERBOSE=true npm run test:selenium

# Con screenshots
SCREENSHOTS=true HEADLESS=false npm run test:selenium:turno
```

### 5. Proceso de PR

1. Fork el repositorio
2. Crea una rama descriptiva
3. Commits claros y pequeños
4. Push a tu fork
5. Abre PR con descripción detallada

**Descripción del PR debe incluir:**
- Qué cambio haces
- Por qué es necesario
- Cómo se probó
- Screenshots si aplica

Ejemplo:

```markdown
## Descripción
Agregar test para validar que no se puede reservar sin vehículo seleccionado.

## Cambios
- Agregar `testVehicleValidation()` en turno.test.js
- Actualizar selector de botón "Siguiente"
- Mejorar documentación

## Cómo se probó
- Ejecutar con HEADLESS=false
- Verificar que el test pasa
- Verificar que otros tests no se rompieron

## Screenshots
[adjuntar si aplica]
```

### 6. Checklist para PR

- [ ] Los tests pasan: `npm run test:selenium`
- [ ] Código sigue los estándares
- [ ] Comentarios claros y útiles
- [ ] README.md actualizado si es necesario
- [ ] No hay cambios innecesarios
- [ ] Commits limpios y descriptivos

## Roadmap de mejoras

### Corto plazo
- [ ] Mejorar selectores (usar más data-testid)
- [ ] Agregar test para cambiar turno existente
- [ ] Documentación de troubleshooting

### Mediano plazo
- [ ] Tests para múltiples navegadores
- [ ] Visual testing con Applitools
- [ ] Tests de carga/stress

### Largo plazo
- [ ] Integración con Allure reports
- [ ] Dashboard de resultados
- [ ] Tests de accesibilidad (a11y)

## Reportar bugs

Si encuentras un problema:

1. Verifica que no esté reportado
2. Crea un issue con:
   - Descripción clara
   - Pasos para reproducir
   - Resultado esperado vs actual
   - Versión de Node.js
   - Versión de Chrome
   - Logs si aplica

Ejemplo:

```markdown
### Descripción
El test de selección de vehículo falla intermitentemente

### Pasos para reproducir
1. npm run test:selenium:turno
2. El test falla 50% de las veces

### Esperado
Los tests deben ser consistentes

### Actual
Timeout esperando elemento de vehículo

### Información
- Node.js: v18.2.0
- Chrome: 121.0.0
- HEADLESS=true
```

## Preguntas frecuentes

**P: ¿Puedo modificar config.js?**
R: Sí, pero documenta los cambios. Preferentemente agregar variables de entorno.

**P: ¿Debo agregar screenshots?**
R: Para nuevos tests, sí. Ayuda a debugging.

**P: ¿Cuál es la mejor manera de agregar un nuevo test?**
R: 
1. Copia el patrón de un test existente
2. Agrega al archivo apropiado
3. Prueba en modo interactivo: HEADLESS=false
4. Documenta el caso

**P: ¿Qué pasa si un test es flaky (intermitente)?**
R:
1. Aumenta los timeouts
2. Agrega delays adicionales
3. Usa multiple retries
4. Mejora los selectores

## Comunicación

- **Reportar bugs**: GitHub Issues
- **Sugerencias**: GitHub Discussions
- **Colaboración**: Crear issue primero, luego PR
- **Urgencias**: Contactar al mantenedor directo

## Código de conducta

- Sé respetuoso
- Proporciona retroalimentación constructiva
- Sé paciente con los principiantes
- Enfócate en la mejora continua

## Reconocimiento

Todos los contribuyentes serán reconocidos en:
- CONTRIBUTORS.md
- Release notes

## Recursos para contribuyentes

- [Git guide](https://git-scm.com/doc)
- [Selenium WebDriver](https://www.selenium.dev/webdriver/)
- [JavaScript best practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [XPath tutorial](https://www.w3schools.com/xml/xpath_intro.asp)
- [CSS Selectors](https://www.w3schools.com/cssref/selectors_intro.asp)

---

¡Gracias por contribuir! 🙏

Para preguntas, abre un issue en el repositorio.
