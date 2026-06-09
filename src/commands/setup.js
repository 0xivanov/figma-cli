// Commands: setup (extracted from index.js)
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { FigmaClient } from '../figma-client.js';
import * as apiDocs from '../api-docs.js';
import { isPatched, patchFigma, unpatchFigma } from '../figma-patch.js';
import {
  program,
  DAEMON_PORT,
  figmaUse,
  getDaemonToken,
  getManualStartCommand,
  isDaemonRunning,
  killFigma,
  loadConfig,
  pkg,
  saveConfig,
  startDaemon,
  startFigma,
  stopDaemon
} from '../lib/cli-core.js';

program
  .name('figma-ds-cli')
  .description('CLI for managing Figma design systems')
  .version(pkg.version);

// Top-level shortcut: `figma-cli import <file>` — auto-detects what the file
// is and routes to the right importer. Today: DESIGN.md (figma extraction
// format) is the only recognized type, but the dispatcher leaves room for
// other formats (tokens.json, .figmavars, etc.) without breaking the UX.
program
  .command('import <file>')
  .description('Auto-import a design file. Currently supports DESIGN.md (Figma extraction format).')
  .option('-c, --collection <name>', 'Collection name (DESIGN.md only)')
  .option('--print-context', 'Print figmachat context summary without creating variables')
  .action(async (file, options) => {
    const fs = await import('fs');
    if (!fs.existsSync(file)) {
      console.error(chalk.red('✗'), `not found: ${file}`);
      process.exit(1);
    }
    // Sniff the file. We don't trust the extension alone — a `.md` that
    // doesn't have the machine-readable token block isn't a design system.
    // The block usually sits at the END of the file, so read the whole thing
    // (these files are typically a few hundred KB max — cheap).
    const content = fs.readFileSync(file, 'utf-8');
    // Format A: YAML frontmatter with `colors:` / `typography:` (Stitch / getdesign.md style)
    const hasFrontmatterTokens = /^---\s*\n[\s\S]*?(^colors:|^color:|^typography:)/m.test(content);
    // Format B: our DESIGN.md extraction with `## Machine-readable tokens` JSON block
    const hasJsonBlock = /```json\s+design-tokens/.test(content) || /^##\s+\d+\.\s+Machine-readable tokens/m.test(content);
    // Format C: prose design system — role-labelled `**Name** (`#hex`): role` rows
    const proseColorRows = (content.match(/\*\*[^*]+\*\*\s*\(`#[0-9a-fA-F]{3,8}`\)\s*:/g) || []).length;
    const hasProseTokens = proseColorRows >= 3;
    const isDesignMd = hasFrontmatterTokens || hasJsonBlock || hasProseTokens;
    if (isDesignMd) {
      // Forward to the existing implementation via Commander's own machinery.
      const args = ['tokens', 'import-design-md', file];
      if (options.collection) args.push('-c', options.collection);
      if (options.printContext) args.push('--print-context');
      await program.parseAsync(args, { from: 'user' });
      return;
    }
    console.error(chalk.red('✗'), `Unrecognized format: ${file}`);
    console.error(chalk.yellow('  Currently `figma-cli import` understands:'));
    console.error('    • DESIGN.md (must contain "## Machine-readable tokens" + `json design-tokens` block)');
    console.error(chalk.gray('  For other formats use the dedicated importers:'));
    console.error(chalk.gray('    figma-cli tokens import <file.json>   (raw JSON tokens)'));
    process.exit(1);
  });

// Default action when no command is given
program.action(async () => {
  // If user passed an unknown subcommand as first arg, suggest from API docs
  const argv = process.argv.slice(2);
  if (argv.length > 0 && !argv[0].startsWith('-')) {
    const attempted = argv[0];
    console.error(chalk.red(`✗ unknown command: ${attempted}\n`));
    apiDocs.suggest(attempted);
    process.exit(1);
  }

  const config = loadConfig();

  // First time? Run init
  if (!config.patched) {
    showBanner();
    console.log(chalk.white('  Welcome! Let\'s get you set up.\n'));
    console.log(chalk.gray('  This takes about 30 seconds. No API key needed.\n'));

    // Step 1: Check Node version
    console.log(chalk.blue('Step 1/3: ') + 'Checking Node.js...');
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (nodeMajor < 18) {
      console.log(chalk.red(`  ✗ Node.js ${nodeVersion} is too old. Please upgrade to Node 18+`));
      process.exit(1);
    }
    console.log(chalk.green(`  ✓ Node.js ${nodeVersion}`));

    // Step 2: Patch Figma
    console.log(chalk.blue('\nStep 2/3: ') + 'Patching Figma Desktop...');
    if (config.patched) {
      console.log(chalk.green('  ✓ Figma already patched'));
    } else {
      console.log(chalk.gray('  (This allows CLI to connect to Figma)'));
      const spinner = ora('  Patching...').start();
      try {
        const patchStatus = isPatched();
        if (patchStatus === true) {
          config.patched = true;
          saveConfig(config);
          spinner.succeed('Figma already patched');
        } else if (patchStatus === false) {
          patchFigma();
          config.patched = true;
          saveConfig(config);
          spinner.succeed('Figma patched');
        } else {
          // Can't determine - assume it's fine (old Figma version)
          config.patched = true;
          saveConfig(config);
          spinner.succeed('Figma ready (no patch needed)');
        }
      } catch (error) {
        spinner.fail('Patch failed: ' + error.message);
        if ((error.message.includes('EPERM') || error.message.includes('permission') || error.message.includes('Full Disk Access')) && process.platform === 'darwin') {
          console.log(chalk.yellow('\n  ⚠️  Your Terminal needs "Full Disk Access" permission.\n'));
          console.log(chalk.gray('  1. Open System Settings → Privacy & Security → Full Disk Access'));
          console.log(chalk.gray('  2. Click + and add your Terminal app'));
          console.log(chalk.gray('  3. Quit Terminal completely (Cmd+Q)'));
          console.log(chalk.gray('  4. Reopen Terminal and try again\n'));
        } else if (error.message.includes('EPERM') || error.message.includes('permission')) {
          console.log(chalk.yellow('\n  Try running as administrator.\n'));
        }
      }
    }

    // Step 3: Start Figma
    console.log(chalk.blue('\nStep 3/3: ') + 'Starting Figma...');
    try {
      killFigma();
      await new Promise(r => setTimeout(r, 1000));
      startFigma();
      console.log(chalk.green('  ✓ Figma started'));

      // Wait for connection
      const spinner = ora('  Waiting for connection...').start();
      let connected = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        connected = await FigmaClient.isConnected();
        if (connected) break;
      }

      if (connected) {
        spinner.succeed('Connected to Figma');
      } else {
        spinner.warn('Connection pending - open a file in Figma');
      }
    } catch (error) {
      console.log(chalk.yellow('  ! Could not start Figma automatically'));
      console.log(chalk.gray('    Start manually: ' + getManualStartCommand()));
    }

    // Done!
    console.log(chalk.green('\n  ✓ Setup complete!\n'));
    showQuickStart();
    return;
  }

  // Already set up - check connection and show status
  showBanner();

  const connected = await FigmaClient.isConnected();
  if (connected) {
    console.log(chalk.green('  ✓ Connected to Figma\n'));
    try {
      const client = new FigmaClient();
      await client.connect();
      const info = await client.getPageInfo();
      console.log(chalk.gray(`  File: ${client.pageTitle.replace(' – Figma', '')}`));
      console.log(chalk.gray(`  Page: ${info.name}`));
      client.close();
    } catch {}
    console.log();
    showQuickStart();
  } else {
    console.log(chalk.yellow('  ⚠ Figma not connected\n'));
    console.log(chalk.white('  Starting Figma...'));
    try {
      killFigma();
      await new Promise(r => setTimeout(r, 500));
      startFigma();
      console.log(chalk.green('  ✓ Figma started\n'));

      const spinner = ora('  Waiting for connection...').start();
      for (let i = 0; i < 8; i++) {
        await new Promise(r => setTimeout(r, 1000));
        if (await FigmaClient.isConnected()) {
          spinner.succeed('Connected to Figma\n');
          showQuickStart();
          return;
        }
      }
      spinner.warn('Open a file in Figma to connect\n');
      showQuickStart();
    } catch {
      console.log(chalk.gray('  Start manually: ' + getManualStartCommand() + '\n'));
    }
  }
});

function showQuickStart() {
  console.log(chalk.white('  Just ask Claude:\n'));
  console.log(chalk.white('    "Add shadcn colors to my project"'));
  console.log(chalk.white('    "Create a blue card with rounded corners"'));
  console.log(chalk.white('    "Show me what\'s on the canvas"'));
  console.log(chalk.white('    "Export this frame as PNG"'));
  console.log();
  console.log(chalk.gray('  Learn more: ') + chalk.cyan('https://intodesignsystems.com\n'));
}

// ============ WELCOME BANNER ============

function showBanner() {
  console.log(chalk.cyan(`
  ███████╗██╗ ██████╗ ███╗   ███╗ █████╗       ██████╗ ███████╗       ██████╗██╗     ██╗
  ██╔════╝██║██╔════╝ ████╗ ████║██╔══██╗      ██╔══██╗██╔════╝      ██╔════╝██║     ██║
  █████╗  ██║██║  ███╗██╔████╔██║███████║█████╗██║  ██║███████╗█████╗██║     ██║     ██║
  ██╔══╝  ██║██║   ██║██║╚██╔╝██║██╔══██║╚════╝██║  ██║╚════██║╚════╝██║     ██║     ██║
  ██║     ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║      ██████╔╝███████║      ╚██████╗███████╗██║
  ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝       ╚═════╝╚══════╝╚═╝
`));
  console.log(chalk.white(`  Design System CLI for Figma ${chalk.gray('v' + pkg.version)}`));
  console.log(chalk.gray(`  by Sil Bormüller • intodesignsystems.com\n`));
}

// ============ INIT (Interactive Onboarding) ============

program
  .command('init')
  .description('Interactive setup wizard')
  .action(async () => {
    showBanner();

    console.log(chalk.white('  Welcome! Let\'s get you set up.\n'));
    console.log(chalk.gray('  This takes about 30 seconds. No API key needed.\n'));

    // Step 1: Check Node version
    console.log(chalk.blue('Step 1/4: ') + 'Checking Node.js...');
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (nodeMajor < 18) {
      console.log(chalk.red(`  ✗ Node.js ${nodeVersion} is too old. Please upgrade to Node 18+`));
      process.exit(1);
    }
    console.log(chalk.green(`  ✓ Node.js ${nodeVersion}`));

    // Step 2: Patch Figma
    console.log(chalk.blue('\nStep 2/3: ') + 'Patching Figma Desktop...');
    const config = loadConfig();
    if (config.patched) {
      console.log(chalk.green('  ✓ Figma already patched'));
    } else {
      console.log(chalk.gray('  (This allows CLI to connect to Figma)'));
      const spinner = ora('  Patching...').start();
      try {
        const patchStatus = isPatched();
        if (patchStatus === true) {
          config.patched = true;
          saveConfig(config);
          spinner.succeed('Figma already patched');
        } else if (patchStatus === false) {
          patchFigma();
          config.patched = true;
          saveConfig(config);
          spinner.succeed('Figma patched');
        } else {
          config.patched = true;
          saveConfig(config);
          spinner.succeed('Figma ready (no patch needed)');
        }
      } catch (error) {
        spinner.fail('Patch failed: ' + error.message);
        if ((error.message.includes('EPERM') || error.message.includes('permission') || error.message.includes('Full Disk Access')) && process.platform === 'darwin') {
          console.log(chalk.yellow('\n  ⚠️  Your Terminal needs "Full Disk Access" permission.\n'));
          console.log(chalk.gray('  1. Open System Settings → Privacy & Security → Full Disk Access'));
          console.log(chalk.gray('  2. Click + and add your Terminal app'));
          console.log(chalk.gray('  3. Quit Terminal completely (Cmd+Q)'));
          console.log(chalk.gray('  4. Reopen Terminal and try again\n'));
        } else if (error.message.includes('EPERM') || error.message.includes('permission')) {
          console.log(chalk.yellow('\n  Try running as administrator.\n'));
        }
      }
    }

    // Step 3: Start Figma
    console.log(chalk.blue('\nStep 3/3: ') + 'Starting Figma...');
    try {
      killFigma();
      await new Promise(r => setTimeout(r, 1000));
      startFigma();
      console.log(chalk.green('  ✓ Figma started'));

      // Wait for connection
      const spinner = ora('  Waiting for connection...').start();
      let connected = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        connected = await FigmaClient.isConnected();
        if (connected) break;
      }

      if (connected) {
        spinner.succeed('Connected to Figma');
      } else {
        spinner.warn('Connection pending - open a file in Figma');
      }
    } catch (error) {
      console.log(chalk.yellow('  ! Could not start Figma automatically'));
      console.log(chalk.gray('    Start manually: ' + getManualStartCommand()));
    }

    // Done!
    console.log(chalk.green('\n  ✓ Setup complete!\n'));

    console.log(chalk.white('  Just ask Claude:\n'));
    console.log(chalk.white('    "Add shadcn colors to my project"'));
    console.log(chalk.white('    "Create a blue card with rounded corners"'));
    console.log(chalk.white('    "Show me what\'s on the canvas"'));
    console.log(chalk.white('    "Export this frame as PNG"'));
    console.log();
    console.log(chalk.gray('  Learn more: ') + chalk.cyan('https://intodesignsystems.com\n'));
  });

// ============ SETUP (alias for init) ============

program
  .command('setup')
  .description('Setup Figma for CLI access (alias for init)')
  .action(() => {
    // Redirect to init
    execSync('figma-ds-cli init', { stdio: 'inherit' });
  });

// ============ STATUS ============

program
  .command('status')
  .description('Check connection to Figma (CDP) AND the local daemon')
  .action(() => {
    // Check if first run
    const config = loadConfig();
    if (!config.patched && !isDaemonRunning()) {
      console.log(chalk.yellow('\n⚠ First time? Run the setup wizard:\n'));
      console.log(chalk.cyan('  figma-ds-cli init\n'));
      return;
    }
    figmaUse('status');
    // The CDP-side "Connected to Figma" line above only tells half the story.
    // Most CLI commands (render, set-batch, eval …) need the LOCAL daemon
    // running too. Surface its state right here so the user doesn't get a
    // misleading green check while every subsequent command fails with
    // "fetch failed".
    const daemonInfo = isDaemonRunning(true);
    if (daemonInfo && daemonInfo.running) {
      console.log(chalk.green('  ✓ Daemon running') + chalk.gray(` (port ${DAEMON_PORT})`));
    } else if (daemonInfo && daemonInfo.authFailed) {
      console.log(chalk.yellow('  ⚠ Daemon running but token mismatch (auth failed).'));
      console.log(chalk.gray('    Restart with:  figma-cli daemon restart'));
    } else {
      console.log(chalk.yellow('  ⚠ Daemon NOT running'));
      console.log(chalk.gray('    Most commands (render, set-batch, eval) will fail with "fetch failed".'));
      console.log(chalk.gray('    Start it with:  figma-cli daemon start'));
    }
  });

// ============ UNPATCH ============

program
  .command('unpatch')
  .description('Restore Figma to original state (removes remote debugging patch)')
  .action(() => {
    const spinner = ora('Checking Figma patch status...').start();

    try {
      const patchStatus = isPatched();

      if (patchStatus === false) {
        spinner.succeed('Figma is already in original state (not patched)');
        return;
      }

      if (patchStatus === null) {
        spinner.warn('Cannot determine patch status. Figma version may be incompatible.');
        return;
      }

      spinner.text = 'Restoring Figma to original state...';
      unpatchFigma();

      // Update config
      const config = loadConfig();
      config.patched = false;
      saveConfig(config);

      spinner.succeed('Figma restored to original state');
      console.log(chalk.gray('  Remote debugging is now blocked by default.'));
      console.log(chalk.gray('  Run "node src/index.js connect" to re-enable it.'));
    } catch (err) {
      spinner.fail(`Failed to unpatch: ${err.message}`);
    }
  });

// ============ CONNECT ============

program
  .command('connect')
  .description('Connect to Figma Desktop')
  .option('--safe', 'Use Safe Mode (plugin-based, no patching required)')
  .action(async (options) => {
    // Fun welcome message
    console.log(chalk.hex('#FF6B35')('\n  ✨ Hey designer! ') + chalk.white("Don't be afraid of the terminal!"));
    console.log(chalk.hex('#4ECDC4')('  🎨 Happy vibe coding! ') + chalk.gray('— Sil · ') + chalk.hex('#FF6B35')('intodesignsystems.com\n'));

    const config = loadConfig();

    // Safe Mode: Plugin-based connection (no patching, no CDP)
    if (options.safe) {
      console.log(chalk.hex('#4ECDC4')('  🔒 Safe Mode ') + chalk.gray('(plugin-based, no patching required)\n'));

      // Stop any existing daemon
      stopDaemon();

      // Start daemon in plugin mode
      const daemonSpinner = ora('Starting daemon in Safe Mode...').start();
      try {
        startDaemon(true, 'plugin');  // Force restart in plugin mode
        await new Promise(r => setTimeout(r, 1000));
        if (isDaemonRunning()) {
          daemonSpinner.succeed('Daemon running in Safe Mode');
        } else {
          daemonSpinner.fail('Daemon failed to start');
          return;
        }
      } catch (e) {
        daemonSpinner.fail('Daemon failed: ' + e.message);
        return;
      }

      // Show plugin setup instructions
      console.log(chalk.hex('#FF6B35')('\n  ┌─────────────────────────────────────────────────────┐'));
      console.log(chalk.hex('#FF6B35')('  │') + chalk.white.bold('  Setup the FigCli plugin                           ') + chalk.hex('#FF6B35')('│'));
      console.log(chalk.hex('#FF6B35')('  └─────────────────────────────────────────────────────┘\n'));

      console.log(chalk.white.bold('  ONE-TIME SETUP:\n'));
      console.log(chalk.cyan('  1. ') + chalk.white('Open Figma Desktop and any design file'));
      console.log(chalk.cyan('  2. ') + chalk.white('Go to ') + chalk.yellow('Plugins → Development → Import plugin from manifest'));
      console.log(chalk.cyan('  3. ') + chalk.white('Navigate to: ') + chalk.yellow(process.cwd() + '/plugin/manifest.json'));
      console.log(chalk.cyan('  4. ') + chalk.white('Click ') + chalk.yellow('Open') + chalk.white(' — plugin is now installed!\n'));

      console.log(chalk.white.bold('  EACH SESSION:\n'));
      console.log(chalk.cyan('  → ') + chalk.white('In Figma: ') + chalk.yellow('Plugins → Development → FigCli\n'));

      console.log(chalk.gray('  💡 Tip: Right-click plugin → "Add to toolbar" for one-click access\n'));

      // Wait for plugin connection. The daemon stays alive after we exit,
      // so the user can run commands the moment they actually launch the
      // plugin — but we still want to give them a confirmation when it
      // happens during onboarding. Bumped 30→90s after user feedback that
      // 30s wasn't enough time to find the plugin in Figma's menu.
      const pluginSpinner = ora('Waiting for plugin connection...').start();
      let pluginConnected = false;
      const PLUGIN_CONNECT_MAX_WAIT_S = 90;
      for (let i = 0; i < PLUGIN_CONNECT_MAX_WAIT_S; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const pluginToken = getDaemonToken();
          const pluginHeader = pluginToken ? ` -H "X-Daemon-Token: ${pluginToken}"` : '';
          const healthRes = execSync(`curl -s${pluginHeader} http://127.0.0.1:${DAEMON_PORT}/health`, { encoding: 'utf8' });
          const health = JSON.parse(healthRes);
          if (health.plugin) {
            pluginSpinner.succeed('Plugin connected!');
            console.log(chalk.green('\n  ✓ Ready! Safe Mode active.\n'));
            pluginConnected = true;
            break;
          }
        } catch {}
        // Hint at the halfway mark so users know they can still finish setup.
        if (i === Math.floor(PLUGIN_CONNECT_MAX_WAIT_S / 2)) {
          pluginSpinner.text = `Waiting for plugin connection (${PLUGIN_CONNECT_MAX_WAIT_S - i}s left)…`;
        }
      }

      if (!pluginConnected) {
        pluginSpinner.warn('Plugin not detected yet — daemon is still listening.');
        console.log(chalk.gray('\n  The daemon stays running in the background.'));
        console.log(chalk.gray('  Open ') + chalk.yellow('Plugins → Development → FigCli') + chalk.gray(' in Figma whenever you\'re ready —'));
        console.log(chalk.gray('  the next CLI command will connect automatically.\n'));
      }
      return;
    }

    // Yolo Mode: CDP-based connection (default)
    console.log(chalk.hex('#FF6B35')('  🚀 Yolo Mode ') + chalk.gray('(direct CDP connection)\n'));

    // Patch Figma if needed
    if (!config.patched) {
      const patchSpinner = ora('Setting up Figma connection...').start();
      try {
        const patchStatus = isPatched();
        if (patchStatus === true) {
          patchSpinner.succeed('Figma ready');
        } else if (patchStatus === false) {
          patchFigma();
          patchSpinner.succeed('Figma configured');
        } else {
          patchSpinner.succeed('Figma ready');
        }
        config.patched = true;
        saveConfig(config);
      } catch (err) {
        patchSpinner.fail('Setup failed');

        // macOS Full Disk Access needed
        if (process.platform === 'darwin') {
          console.log(chalk.hex('#FF6B35')('\n  ┌─────────────────────────────────────────────────────┐'));
          console.log(chalk.hex('#FF6B35')('  │') + chalk.white.bold('  One-time setup required                           ') + chalk.hex('#FF6B35')('│'));
          console.log(chalk.hex('#FF6B35')('  └─────────────────────────────────────────────────────┘\n'));

          console.log(chalk.white('  Your Terminal needs permission to configure Figma.\n'));

          console.log(chalk.cyan('  Step 1: ') + chalk.white('Open ') + chalk.yellow('System Settings'));
          console.log(chalk.cyan('  Step 2: ') + chalk.white('Go to ') + chalk.yellow('Privacy & Security → Full Disk Access'));
          console.log(chalk.cyan('  Step 3: ') + chalk.white('Click ') + chalk.yellow('+') + chalk.white(' and add ') + chalk.yellow('Terminal'));
          console.log(chalk.cyan('  Step 4: ') + chalk.white('Quit Terminal completely ') + chalk.gray('(Cmd+Q)'));
          console.log(chalk.cyan('  Step 5: ') + chalk.white('Reopen Terminal and try again\n'));

          console.log(chalk.gray('  Or use Safe Mode: ') + chalk.cyan('node src/index.js connect --safe\n'));
        } else {
          console.log(chalk.yellow('\n  Try running as administrator.\n'));
          console.log(chalk.gray('  Or use Safe Mode: ') + chalk.cyan('node src/index.js connect --safe\n'));
        }
        return;
      }
    }

    // Stop any existing daemon
    stopDaemon();

    console.log(chalk.blue('Starting Figma...'));
    try {
      killFigma();
      await new Promise(r => setTimeout(r, 500));
    } catch {}

    startFigma();
    console.log(chalk.green('✓ Figma started\n'));

    // Wait and check connection
    const spinner = ora('Waiting for connection...').start();
    let connected = false;
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const result = figmaUse('status', { silent: true });
      if (result && result.includes('Connected')) {
        spinner.succeed('Connected to Figma');
        console.log(chalk.gray(result.trim()));
        connected = true;
        break;
      }
    }

    if (!connected) {
      spinner.warn('Open a file in Figma to connect');
      return;
    }

    // Start daemon for fast commands (force restart to get fresh connection)
    const daemonSpinner = ora('Starting speed daemon...').start();
    try {
      startDaemon(true, 'auto');  // Auto mode: uses plugin if connected, otherwise CDP
      await new Promise(r => setTimeout(r, 1500));
      if (isDaemonRunning()) {
        daemonSpinner.succeed('Speed daemon running (commands are now 10x faster)');
      } else {
        daemonSpinner.warn('Daemon failed to start, commands will be slower');
      }
    } catch (e) {
      daemonSpinner.warn('Daemon failed: ' + e.message);
    }
  });

