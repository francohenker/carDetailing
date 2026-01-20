/**
 * Helper para formatear datos de auditoría de forma legible en el frontend
 */

export class AuditFormatter {
  /**
   * Formatea los datos según el tipo de entidad y acción
   */
  static formatData(data: any, entidad: string, accion: string): string {
    if (!data) return '';
    
    // Si ya es un string, retornarlo
    if (typeof data === 'string') return data;

    try {
      switch (entidad) {
        case 'SERVICIO':
          return this.formatServicio(data);
        case 'PRODUCTO':
          return this.formatProducto(data);
        case 'PROVEEDOR':
          return this.formatProveedor(data);
        case 'TURNO':
          return this.formatTurno(data);
        case 'USUARIO':
          return this.formatUsuario(data);
        case 'CAR':
          return this.formatCar(data);
        case 'COTIZACION':
          return this.formatCotizacion(data, accion);
        case 'PAGO':
          return this.formatPago(data);
        case 'STOCK':
          if (accion === 'ENVIAR_EMAIL') {
            return this.formatEmailProveedor(data);
          }
          return this.formatGeneral(data);
        case 'SISTEMA':
          return this.formatConfiguracion(data);
        default:
          return this.formatGeneral(data);
      }
    } catch (error) {
      console.error('Error formateando datos:', error);
      return this.formatGeneral(data);
    }
  }

  private static formatServicio(data: any): string {
    const parts: string[] = [];
    if (data.id) parts.push(`ID: ${data.id}`);
    if (data.name) parts.push(`Nombre: ${data.name}`);
    if (data.description) parts.push(`Descripción: ${data.description}`);
    if (data.duration) parts.push(`Duración: ${data.duration} min`);
    return parts.join(' | ');
  }

  private static formatProducto(data: any): string {
    const parts: string[] = [];
    
    // Destacar ID y nombre al inicio para mayor visibilidad
    if (data.name) {
      parts.push(`📦 Producto: ${data.name}`);
    }
    if (data.id) {
      parts.push(`ID: ${data.id}`);
    }
    
    if (data.price !== undefined) parts.push(`Precio: $${data.price}`);
    if (data.stock_actual !== undefined) parts.push(`Stock: ${data.stock_actual}`);
    if (data.stock_minimo !== undefined) parts.push(`Stock Mínimo: ${data.stock_minimo}`);
    
    if (data.suppliers && Array.isArray(data.suppliers)) {
      const proveedores = data.suppliers
        .map((s: any) => `${s.name || 'Sin nombre'} (ID: ${s.id})`)
        .join(', ');
      parts.push(`Proveedores: ${proveedores}`);
    }
    
    return parts.join(' | ');
  }

  private static formatProveedor(data: any): string {
    const parts: string[] = [];
    if (data.id) parts.push(`ID: ${data.id}`);
    if (data.name) parts.push(`Nombre: ${data.name}`);
    if (data.email) parts.push(`Email: ${data.email}`);
    if (data.phone) parts.push(`Teléfono: ${data.phone}`);
    if (data.isActive !== undefined) parts.push(`Estado: ${data.isActive ? 'Activo' : 'Inactivo'}`);
    return parts.join(' | ');
  }

  private static formatTurno(data: any): string {
    const parts: string[] = [];
    if (data.id) parts.push(`ID: ${data.id}`);
    
    if (data.car?.user) {
      const user = data.car.user;
      if(user.lastname === null) {
        parts.push(`Cliente: ${user.firstname}`);
      } else {
      parts.push(`Cliente: ${user.firstname} ${user.lastname}`);
      }
    }
    
    if (data.car) {
      const car = data.car;
      parts.push(`Vehículo: ${car.marca} ${car.model} (${car.patente})`);
    }
    
    if (data.servicio && Array.isArray(data.servicio)) {
      const servicios = data.servicio.map((s: any) => `${s.name} (ID: ${s.id})`).join(', ');
      parts.push(`Servicios: ${servicios}`);
    }
    
    return parts.join(' | ');
  }

  private static formatUsuario(data: any): string {
    const parts: string[] = [];
    if (data.id) parts.push(`ID: ${data.id}`);
    if (data.firstname && data.lastname) {
      parts.push(`Nombre: ${data.firstname} ${data.lastname}`);
    }
    if (data.email) parts.push(`Email: ${data.email}`);
    if (data.role) parts.push(`Rol: ${data.role}`);
    return parts.join(' | ');
  }

  private static formatCar(data: any): string {
    const parts: string[] = [];
    if (data.id) parts.push(`ID: ${data.id}`);
    if (data.marca) parts.push(`Marca: ${data.marca}`);
    if (data.model) parts.push(`Modelo: ${data.model}`);
    if (data.patente) parts.push(`Patente: ${data.patente}`);
    return parts.join(' | ');
  }

  private static formatCotizacion(data: any, accion?: string): string {
    const parts: string[] = [];
    
    // Siempre mostrar ID de la cotización al inicio para todas las acciones
    if (data.id) parts.push(`🔖 Cotización ID: ${data.id}`);
    
    if (accion === 'SELECCIONAR_GANADOR') {
      if (data.supplierName) parts.push(`✓ Ganador: ${data.supplierName}`);
      if (data.totalAmount) parts.push(`Monto: $${data.totalAmount}`);
      if (data.deliveryDays) parts.push(`Entrega: ${data.deliveryDays} días`);
    } else if (accion === 'MARCAR_RECIBIDO') {
      if (data.supplierName) parts.push(`Proveedor: ${data.supplierName}`);
      if (data.productNames && Array.isArray(data.productNames)) {
        parts.push(`Productos recibidos: ${data.productNames.join(', ')}`);
      }
      if (data.totalAmount) parts.push(`Monto: $${data.totalAmount}`);
    } else if (accion === 'RECHAZAR') {
      // Para rechazos, solo mostrar el ID (ya agregado arriba)
      if (!data.id) parts.push('Cotización rechazada');
    } else {
      // Otros casos (CREAR, etc.)
      if (data.supplierName) parts.push(`Proveedor: ${data.supplierName}`);
      if (data.productNames && Array.isArray(data.productNames)) {
        parts.push(`Productos: ${data.productNames.join(', ')}`);
      } else if (data.products && Array.isArray(data.products)) {
        const nombres = data.products.map((p: any) => p.name || `ID: ${p.id}`).join(', ');
        parts.push(`Productos: ${nombres}`);
      }
      if (data.totalAmount) parts.push(`Monto: $${data.totalAmount}`);
    }
    
    return parts.join(' | ');
  }

  private static formatPago(data: any): string {
    const parts: string[] = [];
    if (data.id) parts.push(`ID: ${data.id}`);
    if (data.turnoId) parts.push(`Turno: ${data.turnoId}`);
    if (data.monto) parts.push(`Monto: $${data.monto}`);
    if (data.metodo) parts.push(`Método: ${data.metodo}`);
    return parts.join(' | ');
  }

  private static formatEmailProveedor(data: any): string {
    const parts: string[] = [];
    if (data.supplierName) parts.push(`Proveedor: ${data.supplierName}`);
    if (data.productNames && Array.isArray(data.productNames)) {
      parts.push(`Productos: ${data.productNames.join(', ')}`);
    }
    return parts.join(' | ');
  }

  private static formatConfiguracion(data: any): string {
    const parts: string[] = [];
    if (data.minAmount !== undefined) parts.push(`Monto Mínimo: $${data.minAmount}`);
    if (data.criticalAmount !== undefined) parts.push(`Monto Crítico: $${data.criticalAmount}`);
    if (data.urgentAmount !== undefined) parts.push(`Monto Urgente: $${data.urgentAmount}`);
    return parts.join(' | ');
  }

  private static formatGeneral(data: any): string {
    if (typeof data === 'object') {
      // Intentar formatear de manera genérica
      const parts: string[] = [];
      
      if (data.id) parts.push(`ID: ${data.id}`);
      if (data.name) parts.push(`Nombre: ${data.name}`);
      if (data.description) parts.push(`Descripción: ${data.description}`);
      
      if (parts.length > 0) return parts.join(' | ');
      
      // Si no hay campos reconocibles, hacer un resumen simple
      const keys = Object.keys(data);
      if (keys.length > 0) {
        return `${keys.length} campos actualizados`;
      }
    }
    
    return String(data);
  }

  /**
   * Obtiene un resumen corto de los cambios entre dos objetos
   */
//   static getChangesSummary(oldData: any, newData: any): string {
//     if (!oldData || !newData) return '';

//     const changes: string[] = [];
//     const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

//     keys.forEach(key => {
//       if (oldData[key] !== newData[key]) {
//         changes.push(key);
//       }
//     });

//     if (changes.length === 0) return 'Sin cambios detectados';
//     if (changes.length === 1) return `Cambio en: ${changes[0]}`;
//     if (changes.length <= 3) return `Cambios en: ${changes.join(', ')}`;
//     return `${changes.length} campos modificados`;
//   }
}
