/**
 * Configuración para tests de Selenium
 */

module.exports = {
  // URL base de la aplicación
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // URL del backend API
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  
  // Configuración del navegador
  browser: {
    // Tipo: 'chrome', 'firefox', 'edge'
    type: process.env.BROWSER || 'chrome',
    // Headless: true para ejecución sin interfaz gráfica
    headless: process.env.HEADLESS !== 'false',
    // Timeout general en ms
    timeout: 10000,
    // Timeout para esperas implícitas
    implicitWait: 5000,
  },

  // Credenciales de prueba
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'francohenker2016@gmail.com',
    password: process.env.TEST_USER_PASSWORD || 'opai',
    firstname: 'Test',
    lastname: 'User',
    phone: '+54 11 1234-5678',
  },

  // Datos de vehículo para pruebas
  testCar: {
    marca: 'Toyota',
    model: 'Corolla',
    color: 'Blanco',
    patente: 'ABC-123',
    type: 'AUTO',
  },

  // Delays para simular comportamiento humano (ms)
  delays: {
    betweenActions: 500,
    beforeSubmit: 1000,
    afterSuccess: 2000,
  },

  // Configuración de logging
  log: {
    verbose: process.env.LOG_VERBOSE === 'true',
    screenshots: process.env.SCREENSHOTS === 'true',
    screenshotPath: './selenium/screenshots/',
  },
};
