import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, 'packages', 'backend');
const DIST_DIR = path.join(__dirname, 'dist-backend');

async function buildBackend() {
  try {
    console.log('🚀 Starting backend build process...');

    // Clean dist directory
    console.log('🧹 Cleaning dist-backend directory...');
    await fs.remove(DIST_DIR);
    await fs.ensureDir(DIST_DIR);

    // BEFORE COPY RUN pnpm db:generate;
    console.log('⚙️ Generating database files...');
    execSync('pnpm db:generate', { cwd: SOURCE_DIR, stdio: 'inherit' });

    // Copy backend source files
    console.log('📦 Copying backend source files...');
    await fs.copy(path.join(SOURCE_DIR, 'src'), path.join(DIST_DIR, 'src'), {
      filter: (src) => {
        // Exclude test files and unnecessary files
        const relativePath = path.relative(SOURCE_DIR, src);
        const isTestFile = src.includes('.test.js') || src.includes('.spec.js');
        const isNodeModules = src.includes('node_modules');

        if (isTestFile || isNodeModules) {
          return false;
        }

        console.log(`  Copying: ${relativePath}`);
        return true;
      },
    });

    // Copy package.json
    console.log('📄 Copying package.json...');
    const packageJson = await fs.readJson(path.join(SOURCE_DIR, 'package.json'));

    // Remove devDependencies for production
    delete packageJson.devDependencies;
    delete packageJson.scripts;

    await fs.writeJson(path.join(DIST_DIR, 'package.json'), packageJson, { spaces: 2 });

    // Copy necessary config files
    console.log('⚙️ Copying configuration files...');
    const configFiles = ['.env.example', 'README.md', 'drizzle.config.js'];

    for (const file of configFiles) {
      const filePath = path.join(SOURCE_DIR, file);
      if (await fs.pathExists(filePath)) {
        await fs.copy(filePath, path.join(DIST_DIR, file));
      }
    }

    // Copy drizzle ORM files
    console.log('🗄️ Copying Drizzle ORM files...');
    const drizzleSrc = path.join(SOURCE_DIR, 'drizzle');
    const drizzleDest = path.join(DIST_DIR, 'drizzle');

    await fs.copy(drizzleSrc, drizzleDest);

    // Copy node_modules
    console.log('📚 Copying necessary node_modules...');
    const nodeModulesSrc = path.join(SOURCE_DIR, 'node_modules');
    const nodeModulesDest = path.join(DIST_DIR, 'node_modules');

    await fs.copy(nodeModulesSrc, nodeModulesDest);

    // Create database directory
    console.log('💾 Creating database directory...');
    await fs.ensureDir(path.join(DIST_DIR, 'data'));

    // Copy bin folder
    console.log('🔧 Copying bin folder...');
    const binSrc = path.join(SOURCE_DIR, 'bin');
    const binDest = path.join(DIST_DIR, 'bin');

    await fs.copy(binSrc, binDest);

    // Copy or create .env file
    const envPath = path.join(SOURCE_DIR, '.env');
    if (await fs.pathExists(envPath)) {
      console.log('🔐 Copying .env file...');
      await fs.copy(envPath, path.join(DIST_DIR, '.env'));
    }

    // Create start script
    console.log('📝 Creating start script...');
    const startScript = `import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set working directory to backend folder
process.chdir(__dirname);

// Set NODE_PATH to include the backend node_modules
process.env.NODE_PATH = path.join(__dirname, 'node_modules');

// Import and start the server
import('./src/server.js')
  .then(() => {
    console.log('Backend server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  });
`;

    await fs.writeFile(path.join(DIST_DIR, 'start.js'), startScript);

    // Make start script executable on Unix systems
    if (process.platform !== 'win32') {
      await fs.chmod(path.join(DIST_DIR, 'start.js'), '755');
    }

    // Create installation instructions
    console.log('📚 Creating README...');
    const readme = `# CodeLIMS Backend - Production Build

## Installation

1. Install dependencies:
   \`\`\`bash
   npm install --production
   \`\`\`

2. Configure environment:
   - Copy \`.env.example\` to \`.env\`
   - Update the configuration values

3. Start the server:
   \`\`\`bash
   node start.js
   \`\`\`
   
   Or using npm:
   \`\`\`bash
   npm start
   \`\`\`

## Database

The SQLite database will be created automatically in the \`data\` directory on first run.

## Port

Default port is 3050. Change via PORT environment variable in .env file.
`;

    await fs.writeFile(path.join(DIST_DIR, 'INSTALL.md'), readme);

    // Create verification script
    console.log('🔍 Creating verification script...');
    const verifyScript = `import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying backend build...');
console.log('Working directory:', process.cwd());
console.log('Script directory:', __dirname);

const requiredFiles = [
  'src/server.js',
  'src/config.js',
  'package.json',
  'bin/node.exe'
];

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, 'NOT FOUND');
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('\\n✅ All required files are present!');
  console.log('🚀 You can now test the backend with: node start.js');
} else {
  console.log('\\n❌ Some required files are missing!');
  process.exit(1);
}
`;

    await fs.writeFile(path.join(DIST_DIR, 'verify.js'), verifyScript);

    console.log('✅ Backend build completed successfully!');
    console.log(`📁 Output directory: ${DIST_DIR}`);
    console.log('\n� To verify the build:');
    console.log('   1. cd dist-backend');
    console.log('   2. node verify.js');
    console.log('\n📋 To run:');
    console.log('   1. cd dist-backend');
    console.log('   2. npm install --production');
    console.log('   3. node start.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildBackend();
