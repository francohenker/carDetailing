#!/bin/bash

# Script de ejemplo para ejecutar los tests de Selenium
# Este archivo muestra cómo ejecutar los tests con diferentes configuraciones

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Car Detailing - Selenium Tests Execution Examples          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para mostrar ejemplos
show_example() {
    local num=$1
    local title=$2
    local command=$3
    local description=$4
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Ejemplo $num: $title${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Comando:"
    echo -e "  ${YELLOW}$command${NC}"
    echo ""
    echo "Descripción:"
    echo "  $description"
    echo ""
}

# Ejemplo 1: Tests básicos
show_example 1 "Tests básicos del flujo de turno" \
    "npm run test:selenium:turno" \
    "Ejecuta los tests básicos que cubren el flujo completo de agendar un turno.
   Incluye: selección de vehículo, servicios, fecha, hora y confirmación."

# Ejemplo 2: Tests avanzados
show_example 2 "Tests avanzados (validaciones, cambios, precios)" \
    "npm run test:selenium:advanced" \
    "Ejecuta tests más complejos que incluyen:
   - Cambio de vehículo
   - Cambio de servicios
   - Cálculo de precios
   - Disponibilidad de horarios
   - Validación de campos obligatorios"

# Ejemplo 3: Todos los tests
show_example 3 "Ejecutar todos los tests" \
    "npm run test:selenium" \
    "Ejecuta todos los tests (básicos y avanzados) en secuencia.
   Es el comando más completo para verificar que todo funciona."

# Ejemplo 4: Con interfaz gráfica
show_example 4 "Tests en modo interactivo (ver el navegador)" \
    "HEADLESS=false npm run test:selenium:turno" \
    "Ejecuta los tests sin modo headless, permitiéndote ver el navegador
   en acción. Útil para debugging y entender qué hace cada paso."

# Ejemplo 5: Con screenshots
show_example 5 "Capturar screenshots de cada paso" \
    "SCREENSHOTS=true npm run test:selenium:turno" \
    "Captura screenshots en cada paso del test. Los archivos se guardan en:
   frontend/selenium/screenshots/"

# Ejemplo 6: Logs detallados
show_example 6 "Ejecutar con logs verbosos" \
    "LOG_VERBOSE=true npm run test:selenium:turno" \
    "Muestra información detallada de cada acción que ejecutan los tests.
   Útil para debugging cuando algo falla."

# Ejemplo 7: Combinado
show_example 7 "Combinación: interfaz + screenshots + logs" \
    "HEADLESS=false SCREENSHOTS=true LOG_VERBOSE=true npm run test:selenium:turno" \
    "La mejor combinación para debugging completo:
   - Ve el navegador en tiempo real
   - Captura screenshots de cada paso
   - Muestra logs detallados de todo lo que sucede"

# Ejemplo 8: Guardar logs en archivo
show_example 8 "Ejecutar y guardar logs" \
    "npm run test:selenium:turno 2>&1 | tee test-results-\$(date +%Y%m%d-%H%M%S).log" \
    "Ejecuta los tests y guarda toda la salida en un archivo de log con
   timestamp. Útil para mantener histórico de ejecuciones."

# Ejemplo 9: Reintentos
show_example 9 "Tests con reintentos automáticos" \
    "MAX_RETRIES=3 npm run test:selenium:turno" \
    "Si un test falla, lo reintenta hasta 3 veces. Útil para tests que
   pueden ser intermitentes."

# Ejemplo 10: Variables personalizadas
show_example 10 "Ejecutar contra servidor diferente" \
    "FRONTEND_URL=http://example.com:3000 npm run test:selenium:turno" \
    "Ejecuta los tests contra un servidor frontend diferente.
   Útil para testing en staging o producción."

# Sección de combinaciones útiles
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}COMBINACIONES ÚTILES${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "1. Para desarrollo (ver qué sucede):"
echo -e "   ${YELLOW}HEADLESS=false SCREENSHOTS=true npm run test:selenium:turno${NC}"
echo ""

echo "2. Para debugging detallado:"
echo -e "   ${YELLOW}LOG_VERBOSE=true SCREENSHOTS=true npm run test:selenium:turno${NC}"
echo ""

echo "3. Para CI/CD:"
echo -e "   ${YELLOW}HEADLESS=true npm run test:selenium${NC}"
echo ""

echo "4. Guardar todo con timestamp:"
echo -e "   ${YELLOW}npm run test:selenium 2>&1 | tee logs/test-\$(date +%s).log${NC}"
echo ""

echo "5. Suite completa con reintentos:"
echo -e "   ${YELLOW}MAX_RETRIES=2 npm run test:selenium${NC}"
echo ""

# Tabla de variables de entorno
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}VARIABLES DE ENTORNO DISPONIBLES${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cat << 'EOF'
Variable          Valores              Default     Descripción
─────────────────────────────────────────────────────────────────────
FRONTEND_URL      URL                  localhost:3000
                                                    URL del frontend

BACKEND_URL       URL                  localhost:3001
                                                    URL del backend

BROWSER           chrome|firefox|edge  chrome      Navegador a usar

HEADLESS          true|false           true        Modo sin interfaz

SCREENSHOTS       true|false           false       Capturar pantallas

LOG_VERBOSE       true|false           false       Logs detallados

MAX_RETRIES       número               1           Reintentos en fallos

TEST_USER_EMAIL   email                test@...    Email de usuario

TEST_USER_PASSWORD password             password... Contraseña usuario

EOF

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}PASO A PASO: PRIMERA EJECUCIÓN${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cat << 'EOF'
1. Asegurar que las dependencias estén instaladas:
   $ npm install

2. Verificar que Frontend está corriendo:
   $ npm run dev
   (En otra terminal, en la carpeta /frontend)

3. Verificar que Backend está corriendo:
   $ npm run start
   (En otra terminal, en la carpeta /backend)

4. Ejecutar los tests:
   $ npm run test:selenium:turno

5. Ver resultados:
   ✓ Los tests mostrarán resultado en la consola
   ✓ Si SCREENSHOTS=true, revisar frontend/selenium/screenshots/

EOF

echo ""
echo -e "${GREEN}¡Listo! Ahora puedes ejecutar los tests.${NC}"
echo ""
