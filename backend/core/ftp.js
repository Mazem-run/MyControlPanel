const { exec } = require('child_process');
const db = require('../db/database');
const fsCore = require('./fs');

const isWindows = process.platform === 'win32';

async function installVsftpd() {
    return new Promise((resolve, reject) => {
        if (isWindows) {
            console.log('[Mock] Installing vsftpd on Windows...');
            setTimeout(() => resolve({ success: true, message: 'FTP server installed successfully (Mocked).' }), 2000);
            return;
        }

        console.log('Installing vsftpd via apt...');
        exec('apt-get update && apt-get install -y vsftpd', (error) => {
            if (error) return reject({ success: false, message: 'FTP Installation failed', error: error.message });
            
            // Configure basic vsftpd for local users with chroot
            const config = `
listen=NO
listen_ipv6=YES
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
allow_writeable_chroot=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
ssl_enable=NO
`;
            const fs = require('fs');
            fs.writeFileSync('/etc/vsftpd.conf', config);
            exec('systemctl restart vsftpd', (err) => {
                if (err) return reject({ success: false, message: 'FTP Config failed', error: err.message });
                resolve({ success: true, message: 'FTP server installed and configured!' });
            });
        });
    });
}

function createFtpUser(username, password, domain) {
    return new Promise((resolve, reject) => {
        // Validate inputs
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return reject(new Error('Invalid username'));
        
        // Save to DB first
        db.run('INSERT INTO ftp_users (username, domain, created_at) VALUES (?, ?, ?)', [username, domain, new Date().toISOString()], function(err) {
            if (err) return reject(err);

            const userId = this.lastID;

            if (isWindows) {
                console.log(`[Mock] Created FTP user ${username} for ${domain}`);
                return resolve({ id: userId, username, domain });
            }

            // Real Linux user creation
            const homeDir = `/var/www/${domain}`;
            const cmd = `useradd -d ${homeDir} -s /bin/false ${username} && echo "${username}:${password}" | chpasswd && usermod -aG www-data ${username} && chown -R ${username}:www-data ${homeDir}`;
            
            exec(cmd, (error) => {
                if (error) {
                    // Rollback db if OS failed
                    db.run('DELETE FROM ftp_users WHERE id = ?', [userId]);
                    return reject(new Error('Failed to create system user: ' + error.message));
                }
                resolve({ id: userId, username, domain });
            });
        });
    });
}

function getFtpUsers() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM ftp_users ORDER BY id DESC', [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = {
    installVsftpd,
    createFtpUser,
    getFtpUsers
};
