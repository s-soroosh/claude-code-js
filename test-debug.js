#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting debug test...\n');

// Test 1: Direct bash execution
console.log('Test 1: Running npx claude directly in bash...');
const bashTest = spawn('bash', ['-c', 'npx claude --version'], {
  stdio: 'inherit',
  timeout: 10000
});

bashTest.on('error', (err) => {
  console.error('Bash test error:', err);
});

bashTest.on('exit', (code, signal) => {
  console.log(`Bash test exited with code ${code}, signal ${signal}\n`);
  
  // Test 2: Node spawn with different options
  console.log('Test 2: Running npx claude with spawn and pipe...');
  const spawnTest = spawn('npx', ['claude', '--version'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    timeout: 10000
  });
  
  spawnTest.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
  });
  
  spawnTest.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
  });
  
  spawnTest.on('error', (err) => {
    console.error('Spawn test error:', err);
  });
  
  spawnTest.on('exit', (code, signal) => {
    console.log(`Spawn test exited with code ${code}, signal ${signal}\n`);
    
    // Test 3: Check if npx is available
    console.log('Test 3: Checking npx availability...');
    const npxCheck = spawn('which', ['npx'], {
      stdio: 'pipe'
    });
    
    npxCheck.stdout.on('data', (data) => {
      console.log('npx location:', data.toString().trim());
    });
    
    npxCheck.on('exit', () => {
      // Test 4: Try with full path
      console.log('\nTest 4: Trying with explicit node_modules path...');
      const claudePath = path.join(process.cwd(), 'node_modules', '.bin', 'claude');
      
      const fs = require('fs');
      if (fs.existsSync(claudePath)) {
        console.log(`Found claude at: ${claudePath}`);
        
        const directTest = spawn(claudePath, ['--version'], {
          stdio: 'inherit',
          timeout: 10000
        });
        
        directTest.on('exit', (code, signal) => {
          console.log(`Direct test exited with code ${code}, signal ${signal}`);
        });
      } else {
        console.log('Claude not found in node_modules/.bin/');
        console.log('This suggests the package might not be installed locally.');
      }
    });
  });
});

// Add overall timeout
setTimeout(() => {
  console.error('\nTests timed out after 30 seconds!');
  process.exit(1);
}, 30000);