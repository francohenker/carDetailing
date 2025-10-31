export interface EmpresaConfig {
  razonSocial: string;
  cuit: string;
  email: string;
  telefono: string;
  web?: string;
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
  sucursal: {
    nombre: 'Sucursal Central',
    direccion: 'Av. Principal 1234',
    localidad: 'Apóstoles',
    provincia: 'Misiones',
    codigoPostal: '3350',
    telefono: '+54 11 1234-5678',
  },
};
