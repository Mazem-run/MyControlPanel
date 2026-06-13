const { exec } = require('child_process');
const db = require('../db/database');
const isWindows = process.platform === 'win32';

async function checkMailInstalled() {
    return new Promise((resolve) => {
        if (isWindows) {
            resolve({ installed: false, message: 'Mail server not installed (Mocked on Windows)' });
            return;
        }

        exec('systemctl is-active postfix && systemctl is-active dovecot', (error) => {
            if (error) {
                resolve({ installed: false, message: 'Postfix/Dovecot not running or not installed.' });
            } else {
                resolve({ installed: true, message: 'Postfix and Dovecot are running!' });
            }
        });
    });
}

async function installMail() {
    return new Promise((resolve, reject) => {
        if (isWindows) {
            console.log('[Mock] Installing Postfix & Dovecot on Windows...');
            setTimeout(() => {
                resolve({ success: true, message: 'Mail Server installed successfully (Mocked).' });
            }, 3000);
            return;
        }

        console.log('Installing Postfix and Dovecot via apt...');
        const cmd = `
            export DEBIAN_FRONTEND=noninteractive &&
            apt-get update &&
            apt-get install -y postfix postfix-mysql dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd dovecot-mysql &&
            systemctl enable postfix dovecot &&
            systemctl start postfix dovecot
        `;
        exec(cmd, (error) => {
            if (error) {
                return reject({ success: false, message: 'Mail installation failed', error: error.message });
            }
            resolve({ success: true, message: 'Postfix & Dovecot installed successfully!' });
        });
    });
}

async function createMailAccount(emailPrefix, domain, password) {
    return new Promise((resolve, reject) => {
        const fullEmail = `${emailPrefix}@${domain}`;
        
        // Save to DB
        db.run('INSERT INTO mail_accounts (email, domain, created_at) VALUES (?, ?, ?)', 
        [fullEmail, domain, new Date().toISOString()], function(err) {
            if (err) return reject({ success: false, message: 'Account exists or DB error' });

            if (isWindows) {
                console.log(`[Mock] Created mail account ${fullEmail}`);
                return resolve({ success: true, message: `Mail account ${fullEmail} created!` });
            }

            // Real Linux user creation in Dovecot/Postfix
            // For simplicity in this panel, we use simple htpasswd-like files for Dovecot
            // In a real prod environment, you would use MySQL virtual mappings.
            
            const cmd = `
                echo "${fullEmail}" >> /etc/postfix/vmailbox &&
                echo "${domain}" >> /etc/postfix/virtual_domains &&
                mkdir -p /var/mail/vhosts/${domain}/${emailPrefix} &&
                chown -R vmail:vmail /var/mail/vhosts/${domain} &&
                echo "${fullEmail}:{PLAIN}${password}" >> /etc/dovecot/users &&
                postmap /etc/postfix/vmailbox &&
                systemctl reload postfix dovecot
            `;
            
            exec(cmd, (error) => {
                if (error) {
                    console.error('Failed to configure postfix/dovecot:', error.message);
                    return resolve({ success: true, message: `Account created in Panel, but system config failed (Needs manual setup).` });
                }
                resolve({ success: true, message: `Mail account ${fullEmail} created and configured!` });
            });
        });
    });
}

function getMailAccounts() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM mail_accounts ORDER BY id DESC', [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = {
    checkMailInstalled,
    installMail,
    createMailAccount,
    getMailAccounts
};
