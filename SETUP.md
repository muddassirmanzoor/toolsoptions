# Tools project – setup on server (187.77.22.201)

This project runs **Node.js** (tools API + UI on port 3000), **Python** (PDF/Office conversions), and **Laravel** (admin on port 8000).

## 1. Server URLs

- **Tools UI (Node):** http://187.77.22.201:3000  
- **Laravel admin:** http://187.77.22.201:8000  

Configured in:
- Root `.env` (Node): `PUBLIC_SERVER_URL`, `LARAVEL_API_URL`
- `admin/.env` (Laravel): `APP_URL`, `TOOLS_URL`

## 2. Node.js

Install Node.js and npm if not present (e.g. `apt install nodejs npm` or use nvm).

```bash
cd /home/tools/htdocs/tools.options
# .env already created with server URLs; adjust if needed
npm install
npm start
```

Runs on port 3000 (or `PUBLIC_PORT` from `.env`). Serves `/` and tool modules, and calls Python scripts for conversions.

## 3. Python

```bash
cd /home/tools/htdocs/tools.options
pip install -r requirements.txt
# or: pip3 install -r requirements.txt
```

If your system uses `python3`, set in root `.env`:

```env
PYTHON_PATH=python3
```

## 4. Laravel (admin)

```bash
cd /home/tools/htdocs/tools.options/admin
cp .env.example .env   # or use existing .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate --force
php artisan config:cache
```

Create storage link (for processed files):

```bash
php artisan storage:link
```

Ensure writable dirs:

```bash
chmod -R 775 storage bootstrap/cache
# or run web server user: chown -R www-data:www-data storage bootstrap/cache
```

Run Laravel (development):

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

## 5. Run both (production) – PM2

**PM2 is configured** via `ecosystem.config.cjs` (Node on 3000, Laravel on 8000).

Start both apps:
```bash
cd /home/tools/htdocs/tools.options
pm2 start ecosystem.config.cjs
pm2 save
```

Useful commands:
```bash
pm2 status          # list apps
pm2 logs            # stream logs (both apps)
pm2 logs tools-node  # logs for Node only
pm2 restart all     # restart both
pm2 stop all        # stop both
```

**Start on server boot** (already enabled if you ran it once):
```bash
pm2 startup         # prints command to run (e.g. systemctl enable pm2-root)
pm2 save            # save current process list for resurrect on reboot
```

**Alternative (no PM2):** run `./start-servers.sh` or start Node and Laravel manually (see script). Ensure firewall allows 3000 and 8000.

If the main site at http://187.77.22.201/ is another Laravel app, either:
- Use a separate vhost for this project with document root `admin/public`, or  
- Run Laravel on port 8000 and keep Node on 3000 as configured.

## 6. Firewall

Allow ports 3000 (Node) and 8000 (Laravel) if needed:

```bash
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw reload
```

## 7. Quick check

- Open http://187.77.22.201:3000 → tools listing.
- Open http://187.77.22.201:8000 → redirect to `/modules/index.html` (Node) or Laravel login/dashboard depending on routing.
- Login/register at http://187.77.22.201:8000/login; after login you should be redirected to http://187.77.22.201:3000/.
