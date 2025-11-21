# Testing de Correos Meteorológicos - Documentación para Desarrollo

## Descripción General

Esta documentación explica cómo usar los endpoints de testing para probar el envío de correos electrónicos de aviso por mal tiempo sin necesidad de esperar condiciones meteorológicas reales adversas.

## Endpoints Disponibles

### 1. Obtener Ayuda de Testing
```http
GET /weather/test-email/help
```

**Descripción:** Muestra información completa sobre todos los endpoints de testing disponibles.

**Autenticación:** Requiere rol ADMIN

**Respuesta:**
```json
{
  "description": "Endpoints para testing de correos meteorológicos (solo desarrollo)",
  "endpoints": {
    "POST /weather/test-email/:turnoId": {
      "description": "Enviar correo de prueba para un turno específico",
      "parameters": {
        "turnoId": "ID del turno (número)",
        "type": "Tipo de correo: 'advance' (anticipación) o 'urgent' (urgente) - opcional, default: 'advance'"
      }
    }
  }
}
```

### 2. Listar Turnos Disponibles para Testing
```http
GET /weather/test-email/turnos
```

**Descripción:** Obtiene una lista de turnos pendientes de los próximos 30 días que pueden usarse para testing.

**Autenticación:** Requiere rol ADMIN

**Respuesta:**
```json
{
  "message": "Turnos disponibles para testing de correos meteorológicos",
  "count": 5,
  "turnos": [
    {
      "id": 123,
      "fechaHora": "2024-01-15T10:00:00.000Z",
      "usuario": "Juan Pérez",
      "email": "juan.perez@email.com",
      "vehiculo": "Toyota Corolla",
      "servicios": "Lavado Premium, Encerado",
      "diasHastaTurno": 7
    }
  ],
  "usage": {
    "description": "Usar el ID de turno con el endpoint de test-email",
    "example": "POST /weather/test-email/123?type=advance"
  }
}
```

### 3. Enviar Correo de Prueba
```http
POST /weather/test-email/:turnoId?type={advance|urgent}
```

**Descripción:** Envía un correo de prueba con datos meteorológicos simulados para un turno específico.

**Parámetros:**
- `turnoId` (path): ID del turno (obligatorio)
- `type` (query): Tipo de correo - `advance` o `urgent` (opcional, default: `advance`)

**Autenticación:** Requiere rol ADMIN

**Ejemplos de uso:**
```bash
# Correo de anticipación (5+ días)
POST /weather/test-email/123?type=advance

# Correo urgente (<5 días)
POST /weather/test-email/123?type=urgent

# Correo por defecto (anticipación)
POST /weather/test-email/123
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Correo de prueba enviado exitosamente a juan.perez@email.com",
  "turnoId": 123,
  "emailType": "advance",
  "userEmail": "juan.perez@email.com",
  "daysUntilTurno": 7,
  "weatherSimulated": {
    "turnoDayWeather": {
      "description": "Lluvia",
      "precipitation": 4.2,
      "temperature": 18.5
    },
    "totalBadDays": 3
  }
}
```

## Guía de Uso Paso a Paso

### 1. Obtener Lista de Turnos Disponibles

```bash
curl -X GET "http://localhost:3001/weather/test-email/turnos" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 2. Seleccionar un Turno y Enviar Correo de Prueba

```bash
# Correo de anticipación
curl -X POST "http://localhost:3001/weather/test-email/123?type=advance" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Correo urgente
curl -X POST "http://localhost:3001/weather/test-email/123?type=urgent" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. Verificar el Correo Recibido

El correo incluirá:
- ✅ Botón parametrizado "Modificar mi Turno" o "Modificar Turno Urgente"
- ✅ Datos meteorológicos simulados (lluvia, temperatura)
- ✅ Información completa del turno
- ✅ Pronóstico de 7 días simulado
- ✅ Enlaces a la URL configurada en `URL_FRONTEND`

## Datos Simulados

### Pronóstico Meteorológico Simulado
- **Día del turno:** Siempre se simula mal tiempo (lluvia)
- **Otros días:** 60% probabilidad de mal tiempo
- **Precipitación:** 2-7mm cuando hay lluvia
- **Temperatura:** 15-25°C
- **Códigos meteorológicos:** 61 (lluvia) o 1 (despejado)

### Tipos de Correo

#### Correo de Anticipación (`type=advance`)
- **Botón:** 🔧 Modificar mi Turno (azul)
- **Mensaje:** Recomendación de reprogramación
- **Color:** Azul (#3b82f6)

#### Correo Urgente (`type=urgent`)
- **Botón:** ⚡ Modificar Turno Urgente (naranja)
- **Mensaje:** Aviso urgente
- **Color:** Naranja (#f59e0b)

## URL de Redirección

El botón en el correo redirige a:
```
${process.env.URL_FRONTEND}/user/profile?tab=turnos&modify=${turnoId}
```

**Ejemplo:**
```
http://localhost:3000/user/profile?tab=turnos&modify=123
```

## Testing Frontend

Después de enviar el correo, puedes probar la funcionalidad frontend:

1. **Hacer clic en el botón del correo**
2. **Verificar redirección** a la página del perfil
3. **Comprobar navegación** automática a la pestaña de turnos
4. **Validar notificación** toast informativa
5. **Probar modificación** del turno desde la interfaz

## Requisitos Previos

### Variables de Entorno
```env
# Backend
URL_FRONTEND=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cardetailingtf@gmail.com
SMTP_PASS=your_app_password

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Datos Requeridos
- ✅ Usuario con rol ADMIN autenticado
- ✅ Turno existente con estado 'pendiente'
- ✅ Usuario asociado al turno con email válido
- ✅ Configuración SMTP funcionando

## Troubleshooting

### Error: "Turno con ID X no encontrado"
- Verificar que el turno existe en la base de datos
- Verificar que el turno tiene estado 'pendiente'
- Usar el endpoint `/weather/test-email/turnos` para obtener IDs válidos

### Error: "Error enviando correo"
- Verificar configuración SMTP
- Verificar que el usuario del turno tiene un email válido
- Revisar logs del servidor para más detalles

### Correo no llega
- Verificar configuración SMTP
- Revisar carpeta de spam
- Verificar que el email del usuario es válido

### Botón de redirección no funciona
- Verificar variable `URL_FRONTEND` en el backend
- Verificar que el frontend está ejecutándose en la URL configurada
- Verificar que la ruta `/user/profile` existe y es accesible

## Logs de Debugging

El sistema genera logs detallados:

```
[WeatherEvaluationService] Enviando correo de prueba para turno ID: 123 (tipo: advance)
[WeatherEvaluationService] ✅ Correo de prueba enviado exitosamente a juan.perez@email.com
```

## Seguridad

- ⚠️ **Solo para desarrollo:** Estos endpoints están diseñados únicamente para testing
- 🔒 **Requiere autenticación:** Solo usuarios con rol ADMIN pueden acceder
- 📧 **Correos reales:** Los correos se envían a direcciones reales, usar con precaución
- 🔐 **No exponer en producción:** Asegurar que estos endpoints no estén disponibles en producción

## Ejemplos de Respuesta

### Éxito
```json
{
  "success": true,
  "message": "Correo de prueba enviado exitosamente a usuario@email.com",
  "turnoId": 123,
  "emailType": "advance",
  "userEmail": "usuario@email.com",
  "daysUntilTurno": 7,
  "weatherSimulated": {
    "turnoDayWeather": {
      "description": "Lluvia",
      "precipitation": 4.2,
      "temperature": 18.5
    },
    "totalBadDays": 3
  }
}
```

### Error
```json
{
  "statusCode": 500,
  "message": "Error enviando correo de prueba: Turno con ID 999 no encontrado"
}
```
