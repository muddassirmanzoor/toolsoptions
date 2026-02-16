/**
 * PM2 ecosystem config for tools.options
 * - tools-node: Node.js tools API + UI (port 3000)
 * - tools-laravel: Laravel admin (port 8000)
 *
 * Start:  pm2 start ecosystem.config.cjs
 * Stop:   pm2 stop ecosystem.config.cjs
 * Logs:   pm2 logs
 * Status: pm2 status
 */
const path = require('path');
const root = path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: 'tools-node',
      script: path.join(root, 'index.js'),
      cwd: root,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: { NODE_ENV: 'production' },
      error_file: path.join(root, 'logs', 'pm2-node-error.log'),
      out_file: path.join(root, 'logs', 'pm2-node-out.log'),
      merge_logs: true,
    },
    {
      name: 'tools-laravel',
      script: 'artisan',
      args: 'serve --host=0.0.0.0 --port=8000',
      interpreter: '/usr/bin/php',
      cwd: path.join(root, 'admin'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: { APP_ENV: 'production' },
      error_file: path.join(root, 'logs', 'pm2-laravel-error.log'),
      out_file: path.join(root, 'logs', 'pm2-laravel-out.log'),
      merge_logs: true,
    },
  ],
};
