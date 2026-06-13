const { exec } = require('child_process');
const mysqlCore = require('./mysql');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';

function generateRandomPassword(length = 12) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

function installWordPress(domainName) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Auto-generate DB credentials
            const dbName = `wp_${domainName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}_${generateRandomPassword(4)}`;
            const dbUser = dbName;
            const dbPass = generateRandomPassword(16);

            // 2. Create Database
            await mysqlCore.createDatabase(dbName, dbUser, dbPass);

            // 3. Download and Extract WP
            if (isWindows) {
                console.log(`[Mock] WordPress installed on Windows for ${domainName}`);
                setTimeout(() => {
                    resolve({ 
                        success: true, 
                        message: 'WordPress installed (Mocked)!', 
                        dbName, dbUser, dbPass 
                    });
                }, 2000);
                return;
            }

            const docRoot = `/var/www/${domainName}/html`;
            
            // Wipe existing html folder and download WP
            const cmd = `
                rm -rf ${docRoot}/* && 
                wget https://wordpress.org/latest.tar.gz -O /tmp/wp-${domainName}.tar.gz && 
                tar -xzf /tmp/wp-${domainName}.tar.gz -C /tmp && 
                mv /tmp/wordpress/* ${docRoot}/ && 
                rm -rf /tmp/wordpress /tmp/wp-${domainName}.tar.gz &&
                cp ${docRoot}/wp-config-sample.php ${docRoot}/wp-config.php
            `;

            exec(cmd, (error) => {
                if (error) {
                    return reject({ success: false, message: 'Failed to extract WordPress', error: error.message });
                }

                // 4. Configure wp-config.php
                const configPath = `${docRoot}/wp-config.php`;
                let configData = fs.readFileSync(configPath, 'utf8');
                
                configData = configData.replace(/database_name_here/g, dbName);
                configData = configData.replace(/username_here/g, dbUser);
                configData = configData.replace(/password_here/g, dbPass);

                // Add random salts
                for(let i=0; i<8; i++) {
                    const salt = generateRandomPassword(64);
                    configData = configData.replace(/put your unique phrase here/i, salt);
                }

                fs.writeFileSync(configPath, configData);

                // 5. Fix permissions
                exec(`chown -R www-data:www-data ${docRoot}`, (err) => {
                    if (err) console.error('Failed to set permissions:', err);
                    
                    resolve({ 
                        success: true, 
                        message: `WordPress successfully installed on ${domainName}!`, 
                        dbName, dbUser, dbPass 
                    });
                });
            });

        } catch (err) {
            reject({ success: false, message: 'Installation failed', error: err.message });
        }
    });
}

module.exports = {
    installWordPress
};
