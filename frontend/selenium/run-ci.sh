#!/bin/bash

# Script para ejecutar los tests de Selenium en un entorno de CI/CD
# Configurado para GitHub Actions, GitLab CI, etc.

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║      Car Detailing - Selenium Test Runner          ║"
echo "╚════════════════════════════════════════════════════╝"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Valores por defecto
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
BROWSER="${BROWSER:-chrome}"
HEADLESS="${HEADLESS:-true}"
SCREENSHOTS="${SCREENSHOTS:-true}"
TEST_TYPE="${TEST_TYPE:-turno}"
MAX_RETRIES="${MAX_RETRIES:-1}"

# Funciones auxiliares
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que las variables requeridas estén configuradas
check_requirements() {
  log_info "Verificando requisitos..."

  # Verificar Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
  fi
  log_info "Node.js $(node --version) ✓"

  # Verificar npm
  if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
  fi
  log_info "npm $(npm --version) ✓"

  # Verificar que la aplicación frontend está accesible
  log_info "Verificando acceso a frontend en $FRONTEND_URL..."
  if ! curl -s "$FRONTEND_URL" > /dev/null; then
    log_warn "No se puede acceder a $FRONTEND_URL. Asegúrate de que la aplicación está corriendo."
  else
    log_info "Frontend accesible ✓"
  fi

  echo ""
}

# Instalar dependencias si es necesario
install_dependencies() {
  log_info "Instalando dependencias del proyecto..."
  
  if [ -f "package.json" ]; then
    npm install --only=dev || {
      log_error "Error al instalar dependencias"
      exit 1
    }
    log_info "Dependencias instaladas ✓"
  fi

  echo ""
}

# Ejecutar tests con reintentos
run_tests() {
  local test_script="selenium/${TEST_TYPE}.test.js"
  
  if [ ! -f "$test_script" ]; then
    log_error "Archivo de test no encontrado: $test_script"
    exit 1
  fi

  log_info "Ejecutando tests de Selenium (Tipo: $TEST_TYPE)..."
  log_info "Configuración:"
  log_info "  - Frontend URL: $FRONTEND_URL"
  log_info "  - Backend URL: $BACKEND_URL"
  log_info "  - Browser: $BROWSER"
  log_info "  - Headless: $HEADLESS"
  log_info "  - Screenshots: $SCREENSHOTS"
  echo ""

  # Configurar variables de entorno
  export FRONTEND_URL
  export BACKEND_URL
  export BROWSER
  export HEADLESS
  export SCREENSHOTS
  export LOG_VERBOSE="${LOG_VERBOSE:-false}"

  local attempt=1
  local success=false

  while [ $attempt -le $MAX_RETRIES ]; do
    if [ $attempt -gt 1 ]; then
      log_warn "Reintento $attempt de $MAX_RETRIES..."
      echo ""
    fi

    if node "$test_script"; then
      success=true
      break
    else
      if [ $attempt -lt $MAX_RETRIES ]; then
        log_warn "Tests fallaron. Esperando 5 segundos antes de reintentar..."
        sleep 5
      fi
    fi

    ((attempt++))
  done

  if [ "$success" = true ]; then
    log_info "Tests ejecutados exitosamente ✓"
    return 0
  else
    log_error "Tests fallaron después de $MAX_RETRIES intento(s)"
    return 1
  fi
}

# Procesar screenshots si están habilitados
process_screenshots() {
  if [ "$SCREENSHOTS" = "true" ] && [ -d "selenium/screenshots" ]; then
    log_info "Screenshots guardados en selenium/screenshots/"
    ls -lah selenium/screenshots/ || true
  fi
}

# Mostrar resumen final
show_summary() {
  echo ""
  echo "╔════════════════════════════════════════════════════╗"
  if [ $1 -eq 0 ]; then
    echo -e "║${GREEN}          TESTS COMPLETADOS EXITOSAMENTE          ${NC}║"
  else
    echo -e "║${RED}            TESTS FALLARON - VER LOGS             ${NC}║"
  fi
  echo "╚════════════════════════════════════════════════════╝"
  echo ""
}

# Programa principal
main() {
  check_requirements
  install_dependencies
  
  if run_tests; then
    process_screenshots
    show_summary 0
    exit 0
  else
    process_screenshots
    show_summary 1
    exit 1
  fi
}

# Ejecutar
main "$@"
