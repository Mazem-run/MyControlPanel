const { exec } = require('child_process');
const mysql = require('mysql2/promise');
const isWindows = process.platform === 'win32';

async function checkMySQLInstalled() {
    return new Promise((resolve) => {
        if (isWindows) {
            // Mock installation status on Windows
            resolve({ installed: false, message: 'MySQL is not installed (Mocked on Windows)' });
            return;
        }

        exec('mysql --version', (error, stdout, stderr) => {
            if (error) {
                resolve({ installed: false, message: 'MySQL/MariaDB is not installed.' });
            } else {
                resolve({ installed: true, message: stdout.trim() });
            }
        });
    });
}

async function installMySQL() {
    return new Promise((resolve, reject) => {
        if (isWindows) {
            console.log('[Mock] Installing MySQL on Windows...');
            setTimeout(() => {
                resolve({ success: true, message: 'MySQL installed successfully (Mocked).' });
            }, 3000);
            return;
        }

        console.log('Installing MariaDB via apt...');
        exec('apt-get update && apt-get install -y mariadb-server', (error, stdout, stderr) => {
            if (error) {
                console.error(`Installation failed: ${error.message}`);
                return reject({ success: false, message: 'Installation failed', error: error.message });
            }
            resolve({ success: true, message: 'MariaDB installed successfully!' });
        });
    });
}

async function createDatabase(dbName, dbUser, dbPass) {
    if (isWindows) {
        console.log(`[Mock] Creating database ${dbName} for user ${dbUser}...`);
        return { success: true, message: `Database ${dbName} created (Mocked).` };
    }

    try {
        // Connect via socket (typical for root on local Ubuntu)
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Assuming passwordless root auth via unix socket
        });

        // Prevent SQL injection by validating names (basic alphanumeric check)
        if (!/^[a-zA-Z0-9_]+$/.test(dbName) || !/^[a-zA-Z0-9_]+$/.test(dbUser)) {
            throw new Error('Invalid database or user name.');
        }

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        
        // Check if user exists, if not create
        const [rows] = await connection.query(`SELECT User FROM mysql.user WHERE User = ?`, [dbUser]);
        if (rows.length === 0) {
            await connection.query(`CREATE USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPass}'`);
        } else {
            await connection.query(`ALTER USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPass}'`);
        }

        await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`);
        await connection.query('FLUSH PRIVILEGES');

        await connection.end();

        return { success: true, message: `Database ${dbName} and user ${dbUser} created successfully.` };
    } catch (err) {
        console.error('MySQL Error:', err.message);
        throw err;
    }
}

module.exports = {
    checkMySQLInstalled,
    installMySQL,
    createDatabase
};
