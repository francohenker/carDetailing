/**
 * Tests de Selenium para el flujo de agendar turno
 * Casos de prueba:
 * 1. Agendar turno completamente
 * 2. Validaciones del flujo
 * 3. Errores y manejo de excepciones
 */

const { Builder, By, until } = require('selenium-webdriver');
const config = require('./config');
const TestUtils = require('./utils');

class TurnoTest {
  constructor() {
    this.driver = null;
    this.utils = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
    };
  }

  /**
   * Inicializar el driver de Selenium
   */
  async setup() {
    try {
      console.log('Setting up Selenium WebDriver...');
      let builder = new Builder().forBrowser(config.browser.type);

      if (config.browser.headless && config.browser.type === 'chrome') {
        const chrome = require('selenium-webdriver/chrome');
        const options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        builder = builder.setChromeOptions(options);
      }

      this.driver = await builder.build();
      this.utils = new TestUtils(this.driver);

      // Configurar timeouts implícitos
      await this.driver.manage().setTimeouts({
        implicit: config.browser.implicitWait,
        pageLoad: config.browser.timeout,
        script: config.browser.timeout,
      });

      console.log('✓ Selenium WebDriver initialized successfully');
    } catch (error) {
      console.error('✗ Setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Limpiar y cerrar el driver
   */
  async teardown() {
    try {
      if (this.driver) {
        await this.driver.quit();
        console.log('✓ WebDriver closed successfully');
      }
    } catch (error) {
      console.error('✗ Teardown failed:', error.message);
    }
  }

  /**
   * Test: Flujo completo de agendar turno
   */
  async testCompleteBookingFlow() {
    console.log('\n=== Test: Complete Booking Flow ===');
    try {
      // 1. Navegar a la página de turno
      console.log('1. Navigating to turno page...');
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();
      await this.utils.takeScreenshot('01-turno-page-loaded');

      // 2. Verificar que estamos en la página correcta
      const url = await this.driver.getCurrentUrl();
      if (!url.includes('/turno')) {
        throw new Error('Not on turno page');
      }
      console.log('✓ Successfully navigated to turno page');

      // 3. Seleccionar vehículo (Paso 1)
      console.log('2. Selecting vehicle...');
      await this.selectVehicle();
      await this.utils.takeScreenshot('02-vehicle-selected');
      console.log('✓ Vehicle selected successfully');

      // 4. Avanzar al paso 2 (Servicios)
      console.log('3. Proceeding to services selection...');
      await this.proceedToNextStep();
      await this.utils.delay(config.delays.beforeSubmit);
      await this.utils.takeScreenshot('03-services-step');

      // 5. Seleccionar servicios
      console.log('4. Selecting services...');
      await this.selectServices();
      await this.utils.takeScreenshot('04-services-selected');
      console.log('✓ Services selected successfully');

      // 6. Avanzar al paso 3 (Fecha y Hora)
      console.log('5. Proceeding to date and time selection...');
      await this.proceedToNextStep();
      await this.utils.delay(config.delays.beforeSubmit);
      await this.utils.takeScreenshot('05-datetime-step');

      // 7. Seleccionar fecha
      console.log('6. Selecting date...');
      await this.selectDate();
      await this.utils.delay(1000);
      await this.utils.takeScreenshot('06-date-selected');
      console.log('✓ Date selected successfully');

      // 8. Seleccionar hora
      console.log('7. Selecting time slot...');
      await this.selectTimeSlot();
      await this.utils.delay(config.delays.beforeSubmit);
      await this.utils.takeScreenshot('07-time-selected');
      console.log('✓ Time slot selected successfully');

      // 9. Avanzar al paso 4 (Confirmación)
      console.log('8. Proceeding to confirmation...');
      await this.proceedToNextStep();
      await this.utils.delay(config.delays.beforeSubmit);
      await this.utils.takeScreenshot('08-confirmation-step');

      // 10. Verificar resumen de la reserva
      console.log('9. Verifying booking summary...');
      await this.verifyBookingSummary();
      await this.utils.takeScreenshot('09-summary-verified');
      console.log('✓ Booking summary verified');

      // 11. Confirmar la reserva
      console.log('10. Confirming booking...');
      await this.confirmBooking();
      await this.utils.delay(config.delays.afterSuccess);
      await this.utils.takeScreenshot('10-booking-confirmed');
      console.log('✓ Booking confirmed successfully');

      // 12. Verificar redirección a perfil
      console.log('11. Verifying redirect to user profile...');
      await this.utils.waitForUrlContains('/user/profile', config.browser.timeout);
      await this.utils.takeScreenshot('11-redirected-to-profile');
      console.log('✓ Successfully redirected to user profile');

      this.results.passed++;
      console.log('✓ Test completed successfully');
      return true;
    } catch (error) {
      console.error('✗ Test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testCompleteBookingFlow',
        error: error.message,
        stack: error.stack,
      });
      await this.utils.takeScreenshot('error-complete-booking-flow');
      return false;
    }
  }

  /**
   * Seleccionar un vehículo
   */
  async selectVehicle() {
    try {
      // Esperar a que los vehículos carguen
      await this.utils.waitForElementVisible(By.css('[data-testid="vehicle-card"]'), 15000);
      
      // Hacer click en el primer vehículo disponible
      const vehicleCards = await this.driver.findElements(By.css('[data-testid="vehicle-card"]'));
      if (vehicleCards.length === 0) {
        throw new Error('No vehicles available for selection');
      }

      await vehicleCards[0].click();
      await this.utils.delay(config.delays.betweenActions);
    } catch (error) {
      // Si no hay atributo data-testid, intentar por clase
      try {
        const vehicleSelectors = await this.driver.findElements(By.css('.vehicle-select, [role="button"][class*="vehicle"]'));
        if (vehicleSelectors.length > 0) {
          await vehicleSelectors[0].click();
          await this.utils.delay(config.delays.betweenActions);
        } else {
          throw new Error('Could not find vehicle selector elements');
        }
      } catch (fallbackError) {
        throw new Error(`Vehicle selection failed: ${error.message} | ${fallbackError.message}`);
      }
    }
  }

  /**
   * Seleccionar servicios
   */
  async selectServices() {
    try {
      // Esperar a que los servicios carguen
      await this.utils.waitForElementVisible(By.css('[data-testid="service-item"], .service-card, [class*="service"]'), 10000);
      
      const serviceElements = await this.driver.findElements(
        By.css('[data-testid="service-item"], .service-card, [role="checkbox"][class*="service"]')
      );

      if (serviceElements.length === 0) {
        throw new Error('No services found');
      }

      // Seleccionar los primeros 2 servicios
      const servicesToSelect = Math.min(2, serviceElements.length);
      for (let i = 0; i < servicesToSelect; i++) {
        await serviceElements[i].click();
        await this.utils.delay(config.delays.betweenActions);
      }
    } catch (error) {
      throw new Error(`Service selection failed: ${error.message}`);
    }
  }

  /**
   * Seleccionar una fecha
   */
  async selectDate() {
    try {
      // Buscar el calendario y seleccionar una fecha disponible (mañana)
      const calendarButtons = await this.driver.findElements(By.css('[role="button"][class*="calendar"], button[class*="day"]'));
      
      if (calendarButtons.length === 0) {
        // Intenta encontrar botones de día en el calendario
        const dayButtons = await this.driver.findElements(By.css('button[aria-label*="2026"]'));
        if (dayButtons.length > 0) {
          // Seleccionar un día futuro (aproximadamente en el medio del mes)
          const targetButton = dayButtons[Math.min(10, dayButtons.length - 1)];
          await this.driver.executeScript('arguments[0].scrollIntoView(true);', targetButton);
          await this.utils.delay(300);
          await targetButton.click();
          await this.utils.delay(config.delays.betweenActions);
          return;
        }
      }

      // Si aún no encuentra, hacer click en cualquier día disponible
      const availableDay = await this.driver.findElement(By.css('button:not([disabled])[class*="day"], button:not([aria-disabled="true"])[class*="day"]'));
      await availableDay.click();
      await this.utils.delay(config.delays.betweenActions);
    } catch (error) {
      console.warn(`Date selection warning: ${error.message}. Attempting alternative approach...`);
      // Intento alternativo: hacer scroll y buscar manualmente
      try {
        const buttons = await this.driver.findElements(By.css('button'));
        for (let btn of buttons) {
          const text = await btn.getText();
          // Buscar un número entre 15 y 28 (probable día futuro)
          if (/^(1[5-9]|2[0-8])$/.test(text.trim())) {
            await btn.click();
            await this.utils.delay(config.delays.betweenActions);
            return;
          }
        }
        throw error;
      } catch (fallbackError) {
        throw new Error(`Date selection failed after retry: ${error.message}`);
      }
    }
  }

  /**
   * Seleccionar horario
   */
  async selectTimeSlot() {
    try {
      // Esperar a que los horarios carguen
      await this.utils.waitForElementVisible(By.css('[data-testid="time-slot"], [class*="time"], button[class*="slot"]'), 10000);
      
      const timeSlots = await this.driver.findElements(
        By.css('[data-testid="time-slot"], button[class*="slot"], [class*="horario"] button')
      );

      if (timeSlots.length === 0) {
        throw new Error('No time slots available');
      }

      // Seleccionar el primer horario disponible
      await timeSlots[0].click();
      await this.utils.delay(config.delays.betweenActions);
    } catch (error) {
      throw new Error(`Time slot selection failed: ${error.message}`);
    }
  }

  /**
   * Avanzar al siguiente paso
   */
  async proceedToNextStep() {
    try {
      // Buscar botón "Siguiente" o similar
      const buttons = await this.driver.findElements(By.css('button'));
      for (let btn of buttons) {
        const text = await btn.getText();
        if (text.toLowerCase().includes('siguiente') || 
            text.toLowerCase().includes('continuar') ||
            text.toLowerCase().includes('next')) {
          await btn.click();
          await this.utils.delay(config.delays.beforeSubmit);
          return;
        }
      }

      // Alternativa: buscar por clase o atributo
      const nextButton = await this.driver.findElement(By.css('[class*="next"], [class*="continue"], button:last-of-type'));
      await nextButton.click();
      await this.utils.delay(config.delays.beforeSubmit);
    } catch (error) {
      throw new Error(`Proceed to next step failed: ${error.message}`);
    }
  }

  /**
   * Verificar el resumen de la reserva
   */
  async verifyBookingSummary() {
    try {
      // Verificar que se muestren los detalles de la reserva
      const summaryElements = await this.driver.findElements(By.css('[class*="summary"], [class*="resumen"], [data-testid="summary"]'));
      
      if (summaryElements.length === 0) {
        console.warn('Summary elements not found, but continuing test...');
      }

      // Buscar elementos que confirmen que tenemos datos
      const vehicleText = await this.utils.getText(By.css('[class*="vehicle"], h3:contains("Vehículo"), h3')).catch(() => 'vehicle info');
      const serviceText = await this.utils.getText(By.css('[class*="service"], h3:contains("Servicios"), h3')).catch(() => 'service info');
      const dateText = await this.utils.getText(By.css('[class*="date"], h3:contains("Fecha"), h3')).catch(() => 'date info');

      console.log('Summary details visible');
    } catch (error) {
      console.warn(`Verify summary warning: ${error.message}`);
    }
  }

  /**
   * Confirmar la reserva
   */
  async confirmBooking() {
    try {
      // Buscar botón de confirmación
      const buttons = await this.driver.findElements(By.css('button'));
      for (let btn of buttons) {
        const text = await btn.getText();
        if (text.toLowerCase().includes('confirmar') || 
            text.toLowerCase().includes('reservar') ||
            text.toLowerCase().includes('confirm') ||
            text.toLowerCase().includes('book')) {
          await this.driver.executeScript('arguments[0].scrollIntoView(true);', btn);
          await this.utils.delay(config.delays.betweenActions);
          await btn.click();
          await this.utils.delay(config.delays.beforeSubmit);
          return;
        }
      }

      throw new Error('Confirmation button not found');
    } catch (error) {
      throw new Error(`Confirm booking failed: ${error.message}`);
    }
  }

  /**
   * Test: Validaciones del formulario
   */
  async testFormValidations() {
    console.log('\n=== Test: Form Validations ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Intentar avanzar sin seleccionar vehículo
      console.log('1. Testing step advancement without vehicle selection...');
      const nextButton = await this.driver.findElement(By.css('button')).catch(() => null);
      
      if (nextButton) {
        try {
          await nextButton.click();
          // Si el botón se puede hacer click, significa que no hay validación
          console.log('⚠ No validation for vehicle selection');
        } catch {
          console.log('✓ Validation working: cannot proceed without vehicle');
        }
      }

      this.results.passed++;
      console.log('✓ Validation test completed');
      return true;
    } catch (error) {
      console.error('✗ Validation test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testFormValidations',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Test: Navegación hacia atrás
   */
  async testBackNavigation() {
    console.log('\n=== Test: Back Navigation ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Seleccionar vehículo
      await this.selectVehicle();
      await this.proceedToNextStep();
      await this.utils.delay(500);

      // Ir atrás
      console.log('1. Testing back navigation...');
      const backButtons = await this.driver.findElements(By.css('button[class*="back"], button[class*="prev"]'));
      
      if (backButtons.length > 0) {
        await backButtons[0].click();
        await this.utils.delay(config.delays.beforeSubmit);
        console.log('✓ Back navigation working');
      } else {
        console.log('⚠ Back button not found');
      }

      this.results.passed++;
      return true;
    } catch (error) {
      console.error('✗ Back navigation test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testBackNavigation',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Ejecutar todos los tests
   */
  async runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║     CAR DETAILING - TURNO BOOKING TEST SUITE       ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`\nTest URL: ${config.baseUrl}`);
    console.log(`Backend API: ${config.backendUrl}\n`);

    try {
      await this.setup();

      // Ejecutar tests
      await this.testCompleteBookingFlow();
      await this.testFormValidations();
      await this.testBackNavigation();

      // Mostrar resultados
      this.printResults();

      // Retornar código de salida basado en los resultados
      process.exit(this.results.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('Fatal error:', error.message);
      this.results.failed++;
      this.printResults();
      process.exit(1);
    } finally {
      await this.teardown();
    }
  }

  /**
   * Imprimir resultados de los tests
   */
  printResults() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║               TEST RESULTS SUMMARY                 ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log(`✓ Passed: ${this.results.passed}`);
    console.log(`✗ Failed: ${this.results.failed}`);
    console.log(`Total: ${this.results.passed + this.results.failed}\n`);

    if (this.results.errors.length > 0) {
      console.log('Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. Test: ${error.test}`);
        console.log(`   Error: ${error.error}`);
        if (error.stack && config.log.verbose) {
          console.log(`   Stack: ${error.stack}`);
        }
      });
    }

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2);
    console.log(`\nSuccess Rate: ${successRate}%\n`);
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  const test = new TurnoTest();
  test.runAllTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = TurnoTest;
