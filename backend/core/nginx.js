const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ejs = require('ejs');

const templatePath = path.join(__dirname, '../templates/nginx.conf.ejs');

// For local Windows testing, we will mock the paths.
// In a real Ubuntu environment, these would be /etc/nginx/sites-available and /var/www
const isWindows = process.platform === 'win32';

const nginxConfDir = isWindows ? path.join(__dirname, '../../test_env/etc/nginx/sites-available') : '/etc/nginx/sites-available';
const nginxEnabledDir = isWindows ? path.join(__dirname, '../../test_env/etc/nginx/sites-enabled') : '/etc/nginx/sites-enabled';
const webRootDir = isWindows ? path.join(__dirname, '../../test_env/var/www') : '/var/www';

// Ensure test directories exist on Windows
if (isWindows) {
    if (!fs.existsSync(nginxConfDir)) fs.mkdirSync(nginxConfDir, { recursive: true });
    if (!fs.existsSync(nginxEnabledDir)) fs.mkdirSync(nginxEnabledDir, { recursive: true });
    if (!fs.existsSync(webRootDir)) fs.mkdirSync(webRootDir, { recursive: true });
}

async function addDomain(domainName) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Create document root
            const docRoot = isWindows ? path.join(__dirname, '..', 'websites_data', domainName, 'html') : `/var/www/${domainName}/html`;
            if (!fs.existsSync(docRoot)) {
                fs.mkdirSync(docRoot, { recursive: true });
                // Create a default index.html
                fs.writeFileSync(path.join(docRoot, 'index.html'), `<h1>Welcome to ${domainName}!</h1><p>Created by MyControlPanel</p>`);
            }

            // 2. Generate Nginx Config
            const template = fs.readFileSync(templatePath, 'utf8');
            // Force forward slashes for Nginx config even on Windows
            const normalizedDocRoot = docRoot.replace(/\\/g, '/');
            const nginxConfigStr = ejs.render(template, { domain: domainName, documentRoot: normalizedDocRoot });

            const confPath = path.join(nginxConfDir, `${domainName}.conf`);
            fs.writeFileSync(confPath, nginxConfigStr);

            // 3. Create symlink (mock on Windows by just copying for now to avoid symlink privilege issues)
            const enabledPath = path.join(nginxEnabledDir, `${domainName}.conf`);
            if (isWindows) {
                fs.copyFileSync(confPath, enabledPath);
            } else {
                if (!fs.existsSync(enabledPath)) {
                    fs.symlinkSync(confPath, enabledPath);
                }
            }

            // 4. Reload Nginx
            if (isWindows) {
                console.log(`[Mock] Nginx reloaded on Windows. Configs saved in test_env.`);
                resolve();
            } else {
                exec('systemctl reload nginx', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Nginx reload error: ${error.message}`);
                        return reject(error);
                    }
                    resolve();
                });
            }

        } catch (err) {
            reject(err);
        }
    });
}

function enableSSL(domainName) {
    return new Promise((resolve, reject) => {
        if (isWindows) {
            console.log(`[Mock] SSL enabled for ${domainName} via Certbot.`);
            setTimeout(() => resolve({ success: true, message: `SSL issued for ${domainName} (Mocked)` }), 2000);
            return;
        }

        const cmd = `certbot --nginx -d ${domainName} -d www.${domainName} --non-interactive --agree-tos --register-unsafely-without-email`;
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Certbot error: ${error.message}`);
                return reject({ success: false, message: 'Failed to issue SSL', error: error.message });
            }
            resolve({ success: true, message: `SSL successfully installed for ${domainName}!` });
        });
    });
}

module.exports = {
    addDomain,
    enableSSL
};
