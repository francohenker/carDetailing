/**
 * Datos de prueba para los tests de Selenium
 * Puedes modificar estos datos según tus necesidades
 */

module.exports = {
  // Usuarios de prueba
  users: {
    standard: {
      email: 'test.user@example.com',
      password: 'TestPassword123!',
      firstname: 'Juan',
      lastname: 'Test',
      phone: '+54 11 1234-5678',
    },
    admin: {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      firstname: 'Admin',
      lastname: 'User',
      phone: '+54 11 9999-8888',
    },
  },

  // Vehículos de prueba
  vehicles: {
    car1: {
      marca: 'Toyota',
      model: 'Corolla',
      color: 'Blanco',
      patente: 'ABC-123',
      type: 'AUTO',
      year: 2022,
    },
    car2: {
      marca: 'Honda',
      model: 'Civic',
      color: 'Negro',
      patente: 'DEF-456',
      type: 'AUTO',
      year: 2021,
    },
    truck1: {
      marca: 'Ford',
      model: 'F-150',
      color: 'Gris',
      patente: 'GHI-789',
      type: 'CAMIONETA',
      year: 2020,
    },
  },

  // Servicios de prueba
  services: {
    washBasic: {
      name: 'Lavado Básico',
      duration: 30, // minutos
      price: {
        AUTO: 500,
        CAMIONETA: 700,
      },
    },
    washComplete: {
      name: 'Lavado Completo',
      duration: 60,
      price: {
        AUTO: 1000,
        CAMIONETA: 1500,
      },
    },
    polish: {
      name: 'Pulido',
      duration: 45,
      price: {
        AUTO: 800,
        CAMIONETA: 1200,
      },
    },
    wax: {
      name: 'Encerado',
      duration: 30,
      price: {
        AUTO: 600,
        CAMIONETA: 900,
      },
    },
    interior: {
      name: 'Detallado Interior',
      duration: 90,
      price: {
        AUTO: 1200,
        CAMIONETA: 1800,
      },
    },
  },

  // Datos de horarios
  timeSlots: {
    morning: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    afternoon: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
    late: ['17:30', '18:00', '18:30'],
  },

  // Fechas de prueba
  testDates: {
    tomorrow: (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() + 1);
      return d;
    },
    nextWeek: (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() + 7);
      return d;
    },
    nextMonth: (date) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + 1);
      return d;
    },
  },

  // Mensajes esperados
  messages: {
    success: {
      bookingConfirmed: 'Turno reservado exitosamente',
      bookingCreated: 'Turno creado correctamente',
      savedSuccessfully: 'Guardado exitosamente',
    },
    error: {
      invalidEmail: 'Email inválido',
      requiredField: 'Campo requerido',
      noVehicleSelected: 'Debes seleccionar un vehículo',
      noServicesSelected: 'Debes seleccionar al menos un servicio',
      noDateSelected: 'Debes seleccionar una fecha',
      noTimeSelected: 'Debes seleccionar un horario',
    },
    warnings: {
      noAvailableSlots: 'No hay horarios disponibles',
      bookingConflict: 'Conflicto de horario',
    },
  },

  // URLs importantes
  urls: {
    home: '/',
    turno: '/turno',
    servicios: '/servicios',
    login: '/auth/login',
    register: '/auth/register',
    userProfile: '/user/profile',
    userTurnos: '/user/turnos',
    admin: '/admin',
    pagoExitoso: '/pago-exitoso',
  },

  // Configuraciones especiales
  bookingScenarios: {
    // Turno simple: 1 vehículo, 1 servicio, fecha/hora
    simple: {
      vehicle: 'car1',
      services: ['washBasic'],
      expectedDuration: 30,
      expectedPrice: 500,
    },
    // Turno completo: múltiples servicios
    complete: {
      vehicle: 'car1',
      services: ['washComplete', 'wax'],
      expectedDuration: 90,
      expectedPrice: 1600,
    },
    // Turno premium: todos los servicios
    premium: {
      vehicle: 'car1',
      services: ['washComplete', 'polish', 'wax', 'interior'],
      expectedDuration: 225,
      expectedPrice: 3600,
    },
    // Turno para camioneta
    truck: {
      vehicle: 'truck1',
      services: ['washComplete', 'interior'],
      expectedDuration: 150,
      expectedPrice: 3300,
    },
  },

  // Tiempos de espera personalizados
  customWaits: {
    calendarLoad: 5000,
    slotsLoad: 3000,
    confirmationLoad: 4000,
    successPage: 3000,
  },

  // Selectores personalizados si es necesario
  customSelectors: {
    // Puedes agregar selectores adicionales aquí si los defaults no funcionan
    vehicleContainer: '[class*="vehicle-list"], [data-testid="vehicles"]',
    servicesContainer: '[class*="services-list"], [data-testid="services"]',
    calendarContainer: '[class*="calendar-container"], [data-testid="calendar"]',
    timeSlotsContainer: '[class*="timeslots-container"], [data-testid="timeslots"]',
  },
};
