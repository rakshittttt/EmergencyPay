#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('Starting EmergencyPay Flask Application...');

// Build the frontend first
console.log('Building frontend...');
const buildProcess = spawn('npx', ['vite', 'build'], {
  cwd: projectRoot,
  stdio: 'inherit'
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('Frontend build failed');
    process.exit(1);
  }
  
  console.log('Frontend built successfully!');
  console.log('Starting Flask server...');
  
  // Start the Flask server
  const flaskProcess = spawn('python', ['app.py'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '3000'
    }
  });
  
  flaskProcess.on('close', (code) => {
    console.log(`Flask server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down Flask server...');
    flaskProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Shutting down Flask server...');
    flaskProcess.kill('SIGTERM');
  });
});

buildProcess.on('error', (err) => {
  console.error('Error starting build process:', err);
  process.exit(1);
});