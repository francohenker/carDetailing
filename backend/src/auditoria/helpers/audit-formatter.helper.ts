/**
 * Helper para formatear datos de auditoría de forma legible
 * En lugar de mostrar JSON crudo, formatea los datos para mostrar información útil
 */

export class AuditFormatterHelper {
  /**
   * Formatea los datos de un servicio para auditoría
   */
  static formatServicio(servicio: any): string {
    if (!servicio) return '';

    // Si ya es un string formateado, retornarlo
    if (typeof servicio === 'string') return servicio;

    const parts: string[] = [];

    if (servicio.id) parts.push(`ID: ${servicio.id}`);
    if (servicio.name) parts.push(`Nombre: ${servicio.name}`);
    if (servicio.description)
      parts.push(`Descripción: ${servicio.description}`);
    if (servicio.duration) parts.push(`Duración: ${servicio.duration} min`);

    // Formatear precios por tipo de vehículo
    if (servicio.precio && Array.isArray(servicio.precio)) {
      const precios = servicio.precio
        .map((p) => `${p.tipoVehiculo}: $${p.precio}`)
        .join(', ');
      parts.push(`Precios: ${precios}`);
    }

    return parts.length > 0 ? parts.join(' | ') : JSON.stringify(servicio);
  }

  /**
   * Formatea los datos de un producto para auditoría
   */
  static formatProducto(producto: any): string {
    if (!producto) return '';

    const parts: string[] = [];

    if (producto.id) parts.push(`ID: ${producto.id}`);
    if (producto.name) parts.push(`Nombre: ${producto.name}`);
    if (producto.price) parts.push(`Precio: $${producto.price}`);
    if (producto.stock_actual !== undefined)
      parts.push(`Stock: ${producto.stock_actual}`);
    if (producto.stock_minimo !== undefined)
      parts.push(`Stock Mínimo: ${producto.stock_minimo}`);

    // Formatear proveedores por nombre
    if (producto.suppliers && Array.isArray(producto.suppliers)) {
      const proveedores = producto.suppliers
        .map((s) => s.name || `ID: ${s.id}`)
        .join(', ');
      parts.push(`Proveedores: ${proveedores}`);
    } else if (producto.supplierIds && Array.isArray(producto.supplierIds)) {
      parts.push(`IDs de Proveedores: ${producto.supplierIds.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de un proveedor para auditoría
   */
  static formatProveedor(proveedor: any): string {
    if (!proveedor) return '';

    const parts: string[] = [];

    if (proveedor.id) parts.push(`ID: ${proveedor.id}`);
    if (proveedor.name) parts.push(`Nombre: ${proveedor.name}`);
    if (proveedor.email) parts.push(`Email: ${proveedor.email}`);
    if (proveedor.phone) parts.push(`Teléfono: ${proveedor.phone}`);
    if (proveedor.address) parts.push(`Dirección: ${proveedor.address}`);
    if (proveedor.isActive !== undefined)
      parts.push(`Estado: ${proveedor.isActive ? 'Activo' : 'Inactivo'}`);

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de un turno para auditoría
   */
  static formatTurno(turno: any): string {
    if (!turno) return '';

    const parts: string[] = [];

    if (turno.id) parts.push(`ID: ${turno.id}`);

    // Información del cliente
    if (turno.car?.user) {
      const user = turno.car.user;
      if (user.lastname === null) {
        parts.push(`Cliente: ${user.firstname}`);
      } else {
        parts.push(`Cliente: ${user.firstname} ${user.lastname}`);
      }
    }

    // Información del vehículo
    if (turno.car) {
      const car = turno.car;
      parts.push(`Vehículo: ${car.marca} ${car.model} (${car.patente})`);
    }

    // Fecha y hora
    if (turno.fechaHora) {
      const fecha = new Date(turno.fechaHora);
      parts.push(`Fecha: ${fecha.toLocaleString('es-AR')}`);
    }

    // Estado
    if (turno.estado) parts.push(`Estado: ${turno.estado}`);

    // Servicios
    if (turno.servicio && Array.isArray(turno.servicio)) {
      const servicios = turno.servicio
        .map((s) => `${s.name} (ID: ${s.id})`)
        .join(', ');
      parts.push(`Servicios: ${servicios}`);
    }

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de un usuario para auditoría
   */
  static formatUsuario(usuario: any): string {
    if (!usuario) return '';

    const parts: string[] = [];

    if (usuario.id) parts.push(`ID: ${usuario.id}`);
    if (usuario.firstname && usuario.lastname) {
      parts.push(`Nombre: ${usuario.firstname} ${usuario.lastname}`);
    }
    if (usuario.email) parts.push(`Email: ${usuario.email}`);
    if (usuario.phone) parts.push(`Teléfono: ${usuario.phone}`);
    if (usuario.role) parts.push(`Rol: ${usuario.role}`);

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de un vehículo para auditoría
   */
  static formatCar(car: any): string {
    if (!car) return '';

    const parts: string[] = [];

    if (car.id) parts.push(`ID: ${car.id}`);
    if (car.marca) parts.push(`Marca: ${car.marca}`);
    if (car.model) parts.push(`Modelo: ${car.model}`);
    if (car.year) parts.push(`Año: ${car.year}`);
    if (car.patente) parts.push(`Patente: ${car.patente}`);
    if (car.type) parts.push(`Tipo: ${car.type}`);
    if (car.color) parts.push(`Color: ${car.color}`);

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de una cotización para auditoría
   */
  static formatCotizacion(cotizacion: any, accion?: string): string {
    if (!cotizacion) return '';

    const parts: string[] = [];

    if (cotizacion.id) parts.push(`ID Cotización: ${cotizacion.id}`);

    // Para selección de ganador
    if (accion === 'SELECCIONAR_GANADOR' && cotizacion.responseId) {
      parts.push(`ID Respuesta Ganadora: ${cotizacion.responseId}`);
    }

    // Productos solicitados
    if (cotizacion.products && Array.isArray(cotizacion.products)) {
      const productos = cotizacion.products
        .map((p) => p.name || `ID: ${p.id}`)
        .join(', ');
      parts.push(`Productos: ${productos}`);
    } else if (cotizacion.productIds && Array.isArray(cotizacion.productIds)) {
      parts.push(`IDs de Productos: ${cotizacion.productIds.join(', ')}`);
    }

    // Proveedores contactados
    if (cotizacion.suppliers && Array.isArray(cotizacion.suppliers)) {
      const proveedores = cotizacion.suppliers
        .map((s) => s.name || `ID: ${s.id}`)
        .join(', ');
      parts.push(`Proveedores: ${proveedores}`);
    } else if (
      cotizacion.supplierIds &&
      Array.isArray(cotizacion.supplierIds)
    ) {
      parts.push(`IDs de Proveedores: ${cotizacion.supplierIds.join(', ')}`);
    }

    if (cotizacion.status) parts.push(`Estado: ${cotizacion.status}`);
    if (cotizacion.notes) parts.push(`Notas: ${cotizacion.notes}`);

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de envío de email a proveedor
   */
  static formatEmailProveedor(data: any): string {
    if (!data) return '';

    const parts: string[] = [];

    if (data.supplierId) parts.push(`ID Proveedor: ${data.supplierId}`);
    if (data.supplierName) parts.push(`Proveedor: ${data.supplierName}`);

    if (data.productIds && Array.isArray(data.productIds)) {
      parts.push(`Productos solicitados (IDs): ${data.productIds.join(', ')}`);
    }

    if (data.productNames && Array.isArray(data.productNames)) {
      parts.push(`Productos: ${data.productNames.join(', ')}`);
    }

    if (data.message) parts.push(`Mensaje: ${data.message}`);

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de pago para auditoría
   */
  static formatPago(pago: any): string {
    if (!pago) return '';

    const parts: string[] = [];

    if (pago.id) parts.push(`ID: ${pago.id}`);
    if (pago.turnoId) parts.push(`ID Turno: ${pago.turnoId}`);
    if (pago.monto) parts.push(`Monto: $${pago.monto}`);
    if (pago.metodo) parts.push(`Método: ${pago.metodo}`);
    if (pago.estado) parts.push(`Estado: ${pago.estado}`);

    return parts.join(' | ');
  }

  /**
   * Formatea los datos de configuración del sistema
   */
  static formatConfiguracion(config: any): string {
    if (!config) return '';

    const parts: string[] = [];

    if (config.minAmount !== undefined)
      parts.push(`Monto Mínimo: $${config.minAmount}`);
    if (config.criticalAmount !== undefined)
      parts.push(`Monto Crítico: $${config.criticalAmount}`);
    if (config.urgentAmount !== undefined)
      parts.push(`Monto Urgente: $${config.urgentAmount}`);

    return parts.join(' | ');
  }

  /**
   * Compara dos objetos y retorna un string con los cambios
   */
  static formatCambios(anterior: any, nuevo: any): string {
    if (!anterior || !nuevo) return '';

    const cambios: string[] = [];
    const keys = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);

    keys.forEach((key) => {
      if (anterior[key] !== nuevo[key]) {
        cambios.push(`${key}: "${anterior[key]}" → "${nuevo[key]}"`);
      }
    });

    return cambios.join(' | ');
  }
}
