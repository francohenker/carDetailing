export interface HorarioAtencion {
  horaInicio: number;
  horaFin: number;
  horasTrabajo: number;
}

export interface EmpresaConfig {
  razonSocial: string;
  cuit: string;
  email: string;
  telefono: string;
  web?: string;
  horarioAtencion: HorarioAtencion;
  sucursal: {
    nombre: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigoPostal: string;
    telefono?: string;
  };
}

export const empresaInfo: EmpresaConfig = {
  razonSocial: 'Car Detailing S.A.',
  cuit: '30-12345678-9',
  email: 'cardetailingtf@gmail.com',
  telefono: '+54 11 1234-5678',
  web: 'www.cardetailing.com.ar',
  horarioAtencion: {
    horaInicio: 8, // 8:00 AM
    horaFin: 18, // 6:00 PM
    horasTrabajo: 10, // Total de horas trabajadas en el día
  },
  sucursal: {
    nombre: 'Sucursal Central',
    direccion: 'Av. Principal 1234',
    localidad: 'Apóstoles',
    provincia: 'Misiones',
    codigoPostal: '3350',
    telefono: '+54 11 1234-5678',
  },
};
