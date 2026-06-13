const { exec } = require('child_process');
const isWindows = process.platform === 'win32';

async function checkPHPInstalled() {
    return new Promise((resolve) => {
        if (isWindows) {
            resolve({ installed: false, message: 'PHP-FPM is not installed (Mocked on Windows)' });
            return;
        }

        exec('php-fpm8.1 -v', (error, stdout, stderr) => {
            if (error) {
                resolve({ installed: false, message: 'PHP-FPM is not installed.' });
            } else {
                resolve({ installed: true, message: stdout.split('\n')[0] });
            }
        });
    });
}

async function installPHP() {
    return new Promise((resolve, reject) => {
        if (isWindows) {
            console.log('[Mock] Installing PHP-FPM on Windows...');
            setTimeout(() => {
                resolve({ success: true, message: 'PHP-FPM 8.1 installed successfully (Mocked).' });
            }, 3000);
            return;
        }

        console.log('Installing PHP-FPM 8.1 via apt...');
        exec('apt-get update && apt-get install -y php8.1-fpm php8.1-mysql php8.1-curl php8.1-mbstring php8.1-xml', (error, stdout, stderr) => {
            if (error) {
                console.error(`PHP Installation failed: ${error.message}`);
                return reject({ success: false, message: 'Installation failed', error: error.message });
            }
            resolve({ success: true, message: 'PHP-FPM 8.1 installed successfully!' });
        });
    });
}

module.exports = {
    checkPHPInstalled,
    installPHP
};
