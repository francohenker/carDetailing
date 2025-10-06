# 🚗 carDetailing - Sistema de Gestión para Servicios de Detailing Automotriz

Este proyecto es un sistema orientado a la gestión de un centro de **detailing automotriz**. Permite a los clientes reservar turnos, realizar pagos en línea, gestionar insumos necesarios para los servicios, y obtener estadísticas clave sobre la operación del negocio.

## 📦 Características principales

### 🧩 Módulos funcionales

- **Gestión de clientes y vehículos:** Registro y seguimiento de clientes, junto a los vehículos asociados.
- **Turnos:** Agenda de turnos, visualización de disponibilidad y notificaciones.
- **Pagos:** Integración con Mercado Pago para cobros automáticos.
- **Insumos:** Control de stock, alertas de reposición y compras automáticas al proveedor.
- **Estadísticas:** Visualización de métricas de uso del sistema y rendimiento del negocio.

### 🔒 Módulos no funcionales

- Seguridad y control de acceso con roles (cliente, administrador).
- Interfaz responsive 
- Persistencia de datos con PostgreSQL.
- Rendimiento aceptable bajo carga normal.

## ⚙️ Tecnologías utilizadas

- **Backend:** NestJS + TypeORM
- **Base de datos:** PostgreSQL
- **Frontend:** NextJS
- **Autenticación:** JWT
- **Pagos:** Mercado Pago API

## 🚀 Instalación y ejecución

```bash
# Clonar el repositorio
git clone https://github.com/francohenker/carDetailing.git
cd carDetailing

# Instalar dependencias backend
cd backend
npm install

# Iniciar servidor
npm run start

# Instalar dependencias frontend
cd ../frontend
npm install

# Iniciar interfaz web
npm run dev
