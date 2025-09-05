#!/usr/bin/env node

/**
 * Script para iniciar o frontend com configurações corretas.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function checkDependencies() {
    console.log('🔍 Verificando dependências...');
    
    const packageJson = path.join(__dirname, 'package.json');
    const nodeModules = path.join(__dirname, 'node_modules');
    
    if (!fs.existsSync(packageJson)) {
        console.error('❌ package.json não encontrado!');
        return false;
    }
    
    if (!fs.existsSync(nodeModules)) {
        console.log('📦 Instalando dependências...');
        const install = spawn('npm', ['install'], { 
            stdio: 'inherit',
            shell: true 
        });
        
        install.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Dependências instaladas');
                startDevServer();
            } else {
                console.error('❌ Erro ao instalar dependências');
            }
        });
        return false;
    }
    
    console.log('✅ Dependências encontradas');
    return true;
}

function checkFirebaseConfig() {
    console.log('🔍 Verificando configuração do Firebase...');
    
    const firebaseConfig = path.join(__dirname, 'src', 'firebase', 'config.ts');
    
    if (!fs.existsSync(firebaseConfig)) {
        console.error('❌ Configuração do Firebase não encontrada!');
        console.log('📋 Verifique se o arquivo src/firebase/config.ts existe');
        return false;
    }
    
    console.log('✅ Configuração do Firebase encontrada');
    return true;
}

function startDevServer() {
    console.log('🚀 Iniciando servidor de desenvolvimento...');
    console.log('📍 URL: http://localhost:3000');
    console.log('🔄 Pressione Ctrl+C para parar');
    console.log('-'.repeat(50));
    
    const dev = spawn('npm', ['run', 'dev'], { 
        stdio: 'inherit',
        shell: true 
    });
    
    dev.on('close', (code) => {
        if (code !== 0) {
            console.error(`❌ Servidor parou com código ${code}`);
        } else {
            console.log('👋 Servidor parado');
        }
    });
}

function main() {
    console.log('🚀 Iniciando Frontend RoB2');
    console.log('='.repeat(30));
    
    // Verificar dependências
    if (!checkDependencies()) {
        return;
    }
    
    // Verificar configuração do Firebase
    if (!checkFirebaseConfig()) {
        process.exit(1);
    }
    
    // Iniciar servidor
    startDevServer();
}

main();
