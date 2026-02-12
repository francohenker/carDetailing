/**
 * Utilidades para tests de Selenium
 */

const { By, until, Actions } = require('selenium-webdriver');
const config = require('./config');
const fs = require('fs');
const path = require('path');

class TestUtils {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Esperar a que un elemento esté presente en el DOM
   */
  async waitForElement(locator, timeout = config.browser.timeout) {
    try {
      await this.driver.wait(until.elementLocated(locator), timeout);
      return await this.driver.findElement(locator);
    } catch (error) {
      throw new Error(`Element not found: ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Esperar a que un elemento sea visible
   */
  async waitForElementVisible(locator, timeout = config.browser.timeout) {
    try {
      const element = await this.waitForElement(locator, timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      return element;
    } catch (error) {
      throw new Error(`Element not visible: ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Click en un elemento con delay
   */
  async click(locator, withDelay = true) {
    try {
      const element = await this.waitForElementVisible(locator);
      if (withDelay) {
        await this.delay(config.delays.betweenActions);
      }
      await element.click();
    } catch (error) {
      throw new Error(`Click failed on ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Escribir texto en un campo
   */
  async sendKeys(locator, text, clear = true) {
    try {
      const element = await this.waitForElementVisible(locator);
      if (clear) {
        await element.clear();
      }
      await this.delay(config.delays.betweenActions);
      await element.sendKeys(text);
    } catch (error) {
      throw new Error(`SendKeys failed on ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Obtener texto de un elemento
   */
  async getText(locator) {
    try {
      const element = await this.waitForElement(locator);
      return await element.getText();
    } catch (error) {
      throw new Error(`GetText failed on ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Obtener valor de un atributo
   */
  async getAttribute(locator, attribute) {
    try {
      const element = await this.waitForElement(locator);
      return await element.getAttribute(attribute);
    } catch (error) {
      throw new Error(`GetAttribute failed on ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Verificar si un elemento está presente
   */
  async isElementPresent(locator) {
    try {
      await this.driver.findElement(locator);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Espera general
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scroll a un elemento
   */
  async scrollToElement(locator) {
    try {
      const element = await this.waitForElement(locator);
      await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
      await this.delay(300);
    } catch (error) {
      throw new Error(`Scroll failed on ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Mover mouse a un elemento
   */
  async moveToElement(locator) {
    try {
      const element = await this.waitForElement(locator);
      const actions = this.driver.actions({ async: true });
      await actions.move({ origin: element }).perform();
      await this.delay(300);
    } catch (error) {
      throw new Error(`Move to element failed on ${locator}. Error: ${error.message}`);
    }
  }

  /**
   * Ejecutar script JavaScript
   */
  async executeScript(script, ...args) {
    try {
      return await this.driver.executeScript(script, ...args);
    } catch (error) {
      throw new Error(`Execute script failed. Error: ${error.message}`);
    }
  }

  /**
   * Tomar screenshot
   */
  async takeScreenshot(filename) {
    try {
      if (!config.log.screenshots) return;

      const screenshotPath = config.log.screenshotPath;
      if (!fs.existsSync(screenshotPath)) {
        fs.mkdirSync(screenshotPath, { recursive: true });
      }

      const screenshot = await this.driver.takeScreenshot();
      const filepath = path.join(screenshotPath, `${filename}.png`);
      fs.writeFileSync(filepath, screenshot, 'base64');
      console.log(`Screenshot saved: ${filepath}`);
    } catch (error) {
      console.error(`Screenshot failed: ${error.message}`);
    }
  }

  /**
   * Navegar a una URL
   */
  async navigateTo(url) {
    try {
      await this.driver.get(url);
      await this.delay(1000);
    } catch (error) {
      throw new Error(`Navigation failed to ${url}. Error: ${error.message}`);
    }
  }

  /**
   * Esperar a que la página cargue completamente
   */
  async waitForPageLoad(timeout = config.browser.timeout) {
    try {
      await this.driver.wait(async () => {
        const readyState = await this.driver.executeScript('return document.readyState');
        return readyState === 'complete';
      }, timeout);
      await this.delay(500);
    } catch (error) {
      console.warn(`Page load wait timeout: ${error.message}`);
    }
  }

  /**
   * Esperar a que un elemento no esté presente
   */
  async waitForElementNotPresent(locator, timeout = config.browser.timeout) {
    try {
      await this.driver.wait(until.stalenessOf(
        await this.driver.findElement(locator)
      ), timeout);
    } catch (error) {
      // Si el elemento no existe, está bien
    }
  }

  /**
   * Esperar a que una URL contenga un texto
   */
  async waitForUrlContains(text, timeout = config.browser.timeout) {
    try {
      await this.driver.wait(async () => {
        const currentUrl = await this.driver.getCurrentUrl();
        return currentUrl.includes(text);
      }, timeout);
    } catch (error) {
      throw new Error(`URL does not contain ${text}. Error: ${error.message}`);
    }
  }

  /**
   * Limpiar localStorage
   */
  async clearLocalStorage() {
    try {
      await this.driver.executeScript('window.localStorage.clear();');
    } catch (error) {
      console.warn(`Clear localStorage failed: ${error.message}`);
    }
  }

  /**
   * Establecer JWT en localStorage
   */
  async setJWT(token) {
    try {
      await this.driver.executeScript(
        `window.localStorage.setItem('jwt', '${token}');`
      );
    } catch (error) {
      throw new Error(`Set JWT failed. Error: ${error.message}`);
    }
  }

  /**
   * Obtener JWT de localStorage
   */
  async getJWT() {
    try {
      return await this.driver.executeScript('return window.localStorage.getItem("jwt");');
    } catch (error) {
      throw new Error(`Get JWT failed. Error: ${error.message}`);
    }
  }
}

module.exports = TestUtils;
