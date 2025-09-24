#!/usr/bin/env node

/**
 * Script para iniciar o frontend com dependências garantidas.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function installDependencies() {
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install'], {
      stdio: 'inherit',
      shell: true,
    });

    install.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install exited with code ${code}`));
      }
    });
  });
}

function ensureDependencies() {
  const nodeModules = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    return Promise.resolve();
  }

  console.log('📦 Dependências não encontradas. Instalando...');
  return installDependencies();
}

function startDevServer() {
  console.log('🚀 Iniciando servidor de desenvolvimento...');
  console.log('🌐 URL: http://localhost:3000');
  console.log('—'.repeat(50));

  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  dev.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Servidor parou com código ${code}`);
    } else {
      console.log('👋 Servidor finalizado');
    }
  });
}

async function main() {
  console.log('🚀 Frontend RoB2');
  console.log('='.repeat(30));

  try {
    await ensureDependencies();
  } catch (error) {
    console.error('❌ Erro ao instalar dependências:', error.message);
    process.exit(1);
  }

  startDevServer();
}

main();
