/**
 * Página de helpers de localizadores para facilitar la búsqueda de elementos
 * en la aplicación durante los tests
 */

const { By } = require('selenium-webdriver');

/**
 * Localizadores comunes para la página de turno
 */
const TurnoLocators = {
  // Página general
  turnoPageHeader: By.xpath('//h1[contains(text(), "Reservar Turno") or contains(text(), "Agendar")]'),
  progressSteps: By.css('.steps, ul[class*="step"]'),

  // Paso 1: Selección de vehículo
  vehicleCards: By.css('[data-testid="vehicle-card"], .vehicle-select, [class*="vehicle"][class*="card"]'),
  vehicleCardByMark: (mark) => By.xpath(`//div[contains(., "${mark}")][@data-testid="vehicle-card"] | //div[contains(., "${mark}")][contains(@class, "vehicle")]`),
  
  // Paso 2: Selección de servicios
  serviceItems: By.css('[data-testid="service-item"], .service-card, [role="checkbox"][class*="service"]'),
  serviceCheckbox: By.css('[role="checkbox"], input[type="checkbox"]'),
  clearServicesButton: By.xpath('//button[contains(text(), "Limpiar") or contains(text(), "Clear")]'),
  serviceSearch: By.css('[placeholder*="Buscar"], [placeholder*="Search"]'),

  // Paso 3: Selección de fecha
  calendar: By.css('[class*="calendar"], [role="dialog"][class*="calendar"]'),
  calendarDays: By.css('button[class*="day"], [role="button"][class*="day"]'),
  dayButton: (day) => By.xpath(`//button[text()="${day}"][not(@disabled)]`),
  nextMonthButton: By.css('button[class*="next"], [aria-label*="next"]'),
  prevMonthButton: By.css('button[class*="prev"], [aria-label*="previous"]'),

  // Paso 3: Selección de horario
  timeSlots: By.css('[data-testid="time-slot"], button[class*="slot"], [class*="horario"] button, [class*="time"] button'),
  timeSlotsContainer: By.css('[class*="timeslot"], [class*="hora"]'),

  // Confirmación
  summarySection: By.css('[class*="summary"], [class*="resumen"]'),
  vehicleSummary: By.xpath('//h3[contains(text(), "Vehículo")] | //*[contains(text(), "Vehículo")]/following-sibling::*'),
  servicesSummary: By.xpath('//h3[contains(text(), "Servicios")] | //*[contains(text(), "Servicios")]/following-sibling::*'),
  dateSummary: By.xpath('//h3[contains(text(), "Fecha")] | //*[contains(text(), "Fecha")]/following-sibling::*'),
  timeSummary: By.xpath('//h3[contains(text(), "Hora")] | //*[contains(text(), "Hora")]/following-sibling::*'),
  totalPrice: By.xpath('//*[contains(text(), "Total")]/following-sibling::*'),

  // Botones de navegación
  nextButton: By.xpath('//button[contains(text(), "Siguiente") or contains(text(), "Next") or contains(text(), "Continuar")]'),
  backButton: By.xpath('//button[contains(text(), "Atrás") or contains(text(), "Back") or contains(text(), "Anterior")]'),
  confirmButton: By.xpath('//button[contains(text(), "Confirmar") or contains(text(), "Confirm") or contains(text(), "Reservar")]'),
  cancelButton: By.xpath('//button[contains(text(), "Cancelar") or contains(text(), "Cancel")]'),

  // Mensajes y alertas
  successMessage: By.css('[role="status"], [class*="toast"], [class*="alert"][class*="success"]'),
  errorMessage: By.css('[role="alert"], [class*="toast"], [class*="alert"][class*="error"]'),
  loadingSpinner: By.css('[class*="loading"], [class*="spinner"], [role="progressbar"]'),

  // Info de contacto
  contactInfo: By.css('[class*="contact"], [class*="ubicacion"]'),
  phoneNumber: By.xpath('//span[contains(@class, "phone")] | //*[contains(text(), "+54")]'),
  addressInfo: By.xpath('//span[contains(@class, "address")] | //*[contains(text(), "Ruta Nacional")]'),

  // Duración y detalles
  durationInfo: By.xpath('//*[contains(text(), "Duración")] | //*[contains(@class, "duration")]'),
  weatherWidget: By.css('[class*="weather"], [data-testid="weather"]'),
};

/**
 * Localizadores para la página de login
 */
const LoginLocators = {
  emailInput: By.css('input[type="email"], input[name="email"]'),
  passwordInput: By.css('input[type="password"], input[name="password"]'),
  loginButton: By.xpath('//button[contains(text(), "Ingresar") or contains(text(), "Login")]'),
  registerLink: By.xpath('//a[contains(text(), "Registrarse") or contains(text(), "Register")]'),
};

/**
 * Localizadores para la página de usuario
 */
const UserLocators = {
  userProfile: By.css('[class*="profile"], [data-testid="user-profile"]'),
  userTurnos: By.css('[class*="turnos"], [data-testid="user-turnos"]'),
  turnoCard: By.css('[class*="turno"][class*="card"], [data-testid="turno-card"]'),
  editTurnoButton: By.xpath('//button[contains(text(), "Editar") or contains(text(), "Edit")]'),
  deleteTurnoButton: By.xpath('//button[contains(text(), "Eliminar") or contains(text(), "Delete")]'),
  cancelTurnoButton: By.xpath('//button[contains(text(), "Cancelar") or contains(text(), "Cancel")]'),
};

/**
 * Ayudante para esperar y encontrar un elemento por texto
 */
function getElementByText(text, tagName = '*') {
  return By.xpath(`//${tagName}[contains(text(), "${text}")]`);
}

/**
 * Ayudante para encontrar un botón por texto
 */
function getButtonByText(text) {
  return By.xpath(`//button[contains(text(), "${text}")]`);
}

/**
 * Ayudante para encontrar un link por texto
 */
function getLinkByText(text) {
  return By.xpath(`//a[contains(text(), "${text}")]`);
}

/**
 * Ayudante para encontrar un input por label
 */
function getInputByLabel(label) {
  return By.xpath(`//label[contains(text(), "${label}")]/following-sibling::input`);
}

module.exports = {
  TurnoLocators,
  LoginLocators,
  UserLocators,
  getElementByText,
  getButtonByText,
  getLinkByText,
  getInputByLabel,
};
