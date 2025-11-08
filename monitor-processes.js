#!/usr/bin/env node

/**
 * Process Monitor for CodeLIMS Application
 * This script helps monitor multiple processes and prevent running duplicate instances
 */

import { execSync } from 'child_process';

function checkElectronProcesses() {
  try {
    let command;

    if (process.platform === 'win32') {
      command = 'tasklist /FI "IMAGENAME eq electron.exe" /FO CSV';
    } else if (process.platform === 'darwin') {
      command = 'ps aux | grep -i electron | grep -v grep';
    } else {
      command = 'ps aux | grep -i electron | grep -v grep';
    }

    const result = execSync(command, { encoding: 'utf8' });

    console.log('🔍 Current Electron Processes:');
    console.log('================================');
    console.log(result);

    // Count processes
    const lines = result
      .trim()
      .split('\n')
      .filter((line) => line.includes('electron'));
    console.log(`📊 Number of processes detected: ${lines.length}`);

    if (lines.length > 1) {
      console.log('⚠️  Multiple Electron processes detected!');
      console.log('💡 This may indicate multiple instances of the application are running');
    } else if (lines.length === 1) {
      console.log('✅ Only one instance of the application is running');
    } else {
      console.log('ℹ️  No Electron processes are currently running');
    }
  } catch (error) {
    console.error('❌ Error checking processes:', error.message);
  }
}

function checkNodeProcesses() {
  try {
    let command;

    if (process.platform === 'win32') {
      command = 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV';
    } else {
      command = 'ps aux | grep node | grep -v grep';
    }

    const result = execSync(command, { encoding: 'utf8' });

    console.log('\n🔍 Current Node.js Processes:');
    console.log('===============================');
    console.log(result);
  } catch (error) {
    console.error('❌ Error checking Node.js processes:', error.message);
  }
}

function killElectronProcesses() {
  try {
    let command;

    if (process.platform === 'win32') {
      command = 'taskkill /F /IM electron.exe';
    } else {
      command = 'pkill -f electron';
    }

    console.log('🛑 Terminating all Electron processes...');
    execSync(command, { encoding: 'utf8' });
    console.log('✅ All Electron processes terminated successfully');
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('No tasks')) {
      console.log('ℹ️  No Electron processes to terminate');
    } else {
      console.error('❌ Error terminating Electron processes:', error.message);
    }
  }
}

// Process command line arguments
const args = process.argv.slice(2);

if (args.includes('--check') || args.includes('-c')) {
  checkElectronProcesses();
  checkNodeProcesses();
} else if (args.includes('--kill') || args.includes('-k')) {
  killElectronProcesses();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📋 CodeLIMS Process Monitor

Usage:
  node monitor-processes.js [options]

Options:
  -c, --check    Check current processes
  -k, --kill     Terminate all Electron processes
  -h, --help     Show this message

Examples:
  node monitor-processes.js --check
  node monitor-processes.js --kill
  `);
} else {
  console.log('📋 CodeLIMS Process Monitor');
  console.log('Use --help to display available options');
  checkElectronProcesses();
}
