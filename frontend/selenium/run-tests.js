#!/usr/bin/env node

/**
 * Script principal para ejecutar tests de Selenium
 * Uso: npm run test:selenium
 */

const TurnoTest = require('./turno.test');

async function main() {
  const test = new TurnoTest();
  await test.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { TurnoTest };
