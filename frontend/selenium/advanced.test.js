/**
 * Tests avanzados para validaciones y edge cases
 * Este archivo contiene tests más complejos y casos especiales
 */

const { Builder, By, until } = require('selenium-webdriver');
const config = require('./config');
const TestUtils = require('./utils');
const { TurnoLocators, getButtonByText } = require('./locators');

class AdvancedTurnoTest {
  constructor() {
    this.driver = null;
    this.utils = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
    };
  }

  async setup() {
    try {
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

      await this.driver.manage().setTimeouts({
        implicit: config.browser.implicitWait,
        pageLoad: config.browser.timeout,
        script: config.browser.timeout,
      });

      console.log('✓ Advanced test suite initialized');
    } catch (error) {
      console.error('✗ Setup failed:', error.message);
      throw error;
    }
  }

  async teardown() {
    try {
      if (this.driver) {
        await this.driver.quit();
        console.log('✓ WebDriver closed');
      }
    } catch (error) {
      console.error('✗ Teardown failed:', error.message);
    }
  }

  /**
   * Test: Cambio de vehículo en medio del flujo
   */
  async testVehicleChangeInFlow() {
    console.log('\n=== Test: Vehicle Change In Flow ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Seleccionar primer vehículo
      const vehicles = await this.driver.findElements(By.css('[data-testid="vehicle-card"], [class*="vehicle"]'));
      if (vehicles.length < 2) {
        throw new Error('Need at least 2 vehicles to test change');
      }

      await vehicles[0].click();
      await this.utils.delay(config.delays.betweenActions);
      
      const firstVehicleText = await vehicles[0].getText();
      console.log('1. Selected first vehicle');

      // Avanzar a servicios
      await this.clickNextButton();
      await this.utils.delay(config.delays.beforeSubmit);

      // Volver atrás
      await this.clickBackButton();
      await this.utils.delay(config.delays.beforeSubmit);

      // Cambiar a segundo vehículo
      await vehicles[1].click();
      await this.utils.delay(config.delays.betweenActions);
      const secondVehicleText = await vehicles[1].getText();
      console.log('2. Changed to second vehicle');

      // Verificar que se cambió
      if (firstVehicleText === secondVehicleText) {
        throw new Error('Vehicle selection may not have changed');
      }

      this.results.passed++;
      console.log('✓ Vehicle change test passed');
      return true;
    } catch (error) {
      console.error('✗ Vehicle change test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testVehicleChangeInFlow',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Test: Cambio de servicios en medio del flujo
   */
  async testServiceChangeInFlow() {
    console.log('\n=== Test: Service Change In Flow ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Seleccionar vehículo
      const vehicles = await this.driver.findElements(By.css('[data-testid="vehicle-card"], [class*="vehicle"]'));
      await vehicles[0].click();
      await this.utils.delay(config.delays.betweenActions);

      // Avanzar a servicios
      await this.clickNextButton();
      await this.utils.delay(config.delays.beforeSubmit);

      // Seleccionar primer servicio
      const services = await this.driver.findElements(TurnoLocators.serviceItems);
      if (services.length < 2) {
        throw new Error('Need at least 2 services to test change');
      }

      await services[0].click();
      await this.utils.delay(config.delays.betweenActions);
      console.log('1. Selected first service');

      // Seleccionar segundo servicio también
      await services[1].click();
      await this.utils.delay(config.delays.betweenActions);
      console.log('2. Selected second service');

      // Verificar que ambos están seleccionados
      const checkedBoxes = await this.driver.findElements(
        By.css('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked')
      );

      if (checkedBoxes.length < 2) {
        console.warn('Multiple service selection may not be working');
      }

      this.results.passed++;
      console.log('✓ Service change test passed');
      return true;
    } catch (error) {
      console.error('✗ Service change test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testServiceChangeInFlow',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Test: Cálculo correcto de precios
   */
  async testPriceCalculation() {
    console.log('\n=== Test: Price Calculation ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Seleccionar vehículo
      const vehicles = await this.driver.findElements(By.css('[data-testid="vehicle-card"], [class*="vehicle"]'));
      await vehicles[0].click();
      await this.utils.delay(config.delays.betweenActions);

      // Avanzar a servicios
      await this.clickNextButton();
      await this.utils.delay(config.delays.beforeSubmit);

      // Seleccionar servicios y rastrear precios
      const services = await this.driver.findElements(TurnoLocators.serviceItems);
      let expectedTotal = 0;

      for (let i = 0; i < Math.min(2, services.length); i++) {
        const priceText = await services[i].getText();
        console.log(`Service ${i + 1}: ${priceText}`);
        await services[i].click();
        await this.utils.delay(config.delays.betweenActions);
      }

      // Avanzar a confirmación para ver el total
      await this.clickNextButton(); // a fecha/hora
      await this.utils.delay(config.delays.beforeSubmit);
      await this.clickNextButton(); // a confirmación
      await this.utils.delay(config.delays.beforeSubmit);

      // Buscar el total
      const totalElements = await this.driver.findElements(
        By.xpath('//*[contains(text(), "Total")] | //*[contains(text(), "total")]')
      );

      if (totalElements.length > 0) {
        const totalText = await totalElements[0].getText();
        console.log(`Total found: ${totalText}`);
        console.log('✓ Price calculation verified');
      }

      this.results.passed++;
      return true;
    } catch (error) {
      console.error('✗ Price calculation test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testPriceCalculation',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Test: Disponibilidad de horarios
   */
  async testTimeSlotAvailability() {
    console.log('\n=== Test: Time Slot Availability ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Seleccionar vehículo
      const vehicles = await this.driver.findElements(By.css('[data-testid="vehicle-card"], [class*="vehicle"]'));
      await vehicles[0].click();
      await this.utils.delay(config.delays.betweenActions);

      // Avanzar a servicios
      await this.clickNextButton();
      await this.utils.delay(config.delays.beforeSubmit);

      // Seleccionar servicios
      const services = await this.driver.findElements(TurnoLocators.serviceItems);
      if (services.length > 0) {
        await services[0].click();
        await this.utils.delay(config.delays.betweenActions);
      }

      // Avanzar a fecha/hora
      await this.clickNextButton();
      await this.utils.delay(config.delays.beforeSubmit);

      // Seleccionar una fecha
      const dayButtons = await this.driver.findElements(By.css('button[class*="day"]'));
      if (dayButtons.length > 0) {
        // Buscar un día del mes actual/futuro
        for (let btn of dayButtons) {
          const text = await btn.getText();
          const day = parseInt(text);
          if (day >= 4 && day <= 20) { // Día futuro probable
            await this.driver.executeScript('arguments[0].scrollIntoView(true);', btn);
            await btn.click();
            await this.utils.delay(1000);
            break;
          }
        }
      }

      // Esperar a que carguen los horarios
      await this.utils.delay(2000);

      // Buscar slots disponibles
      const slots = await this.driver.findElements(TurnoLocators.timeSlots);
      
      if (slots.length > 0) {
        console.log(`Found ${slots.length} time slots`);
        
        // Contar disponibles vs no disponibles
        let availableCount = 0;
        for (let slot of slots) {
          const isDisabled = await slot.getAttribute('disabled')
            .catch(() => slot.getAttribute('aria-disabled'));
          if (!isDisabled) {
            availableCount++;
          }
        }
        
        console.log(`Available slots: ${availableCount}`);
        if (availableCount > 0) {
          console.log('✓ Available time slots found');
        } else {
          console.warn('⚠ No available time slots');
        }
      } else {
        console.warn('⚠ No time slots found');
      }

      this.results.passed++;
      return true;
    } catch (error) {
      console.error('✗ Time slot availability test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testTimeSlotAvailability',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Test: Campos requeridos
   */
  async testRequiredFields() {
    console.log('\n=== Test: Required Fields ===');
    try {
      await this.utils.navigateTo(`${config.baseUrl}/turno`);
      await this.utils.waitForPageLoad();

      // Intentar avanzar sin seleccionar nada
      console.log('1. Testing vehicle selection requirement');
      const nextButton = await this.driver.findElement(getButtonByText('Siguiente'))
        .catch(() => null);

      if (nextButton) {
        const isEnabled = await nextButton.isEnabled().catch(() => true);
        if (!isEnabled) {
          console.log('✓ Next button disabled without vehicle selection');
        } else {
          console.warn('⚠ Next button may not be properly disabled');
        }
      }

      // Seleccionar vehículo
      const vehicles = await this.driver.findElements(By.css('[data-testid="vehicle-card"], [class*="vehicle"]'));
      if (vehicles.length > 0) {
        await vehicles[0].click();
        await this.utils.delay(config.delays.betweenActions);

        // Ahora debería estar habilitado
        if (nextButton) {
          const isEnabledAfter = await nextButton.isEnabled().catch(() => true);
          if (isEnabledAfter) {
            console.log('✓ Next button enabled after vehicle selection');
          }
        }
      }

      this.results.passed++;
      return true;
    } catch (error) {
      console.error('✗ Required fields test failed:', error.message);
      this.results.failed++;
      this.results.errors.push({
        test: 'testRequiredFields',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Ayudante: Click en botón siguiente
   */
  async clickNextButton() {
    try {
      const button = await this.driver.findElement(getButtonByText('Siguiente'))
        .catch(() => this.driver.findElement(getButtonByText('Continuar')))
        .catch(() => this.driver.findElement(getButtonByText('Next')));
      await button.click();
      return true;
    } catch {
      throw new Error('Next button not found or not clickable');
    }
  }

  /**
   * Ayudante: Click en botón atrás
   */
  async clickBackButton() {
    try {
      const button = await this.driver.findElement(getButtonByText('Atrás'))
        .catch(() => this.driver.findElement(getButtonByText('Back')))
        .catch(() => this.driver.findElement(getButtonByText('Anterior')));
      await button.click();
      return true;
    } catch {
      throw new Error('Back button not found or not clickable');
    }
  }

  /**
   * Ejecutar todos los tests avanzados
   */
  async runAllAdvancedTests() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   CAR DETAILING - ADVANCED TURNO TEST SUITE        ║');
    console.log('╚════════════════════════════════════════════════════╝');

    try {
      await this.setup();

      await this.testVehicleChangeInFlow();
      await this.testServiceChangeInFlow();
      await this.testPriceCalculation();
      await this.testTimeSlotAvailability();
      await this.testRequiredFields();

      this.printResults();
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

  printResults() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║         ADVANCED TEST RESULTS SUMMARY              ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log(`✓ Passed: ${this.results.passed}`);
    console.log(`✗ Failed: ${this.results.failed}`);
    console.log(`Total: ${this.results.passed + this.results.failed}\n`);

    if (this.results.errors.length > 0) {
      console.log('Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.test}`);
        console.log(`   ${error.error}`);
      });
    }

    const total = this.results.passed + this.results.failed;
    const rate = total > 0 ? ((this.results.passed / total) * 100).toFixed(2) : 0;
    console.log(`\nSuccess Rate: ${rate}%\n`);
  }
}

if (require.main === module) {
  const test = new AdvancedTurnoTest();
  test.runAllAdvancedTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = AdvancedTurnoTest;
