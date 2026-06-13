const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');
const nginxCore = require('./core/nginx');
const mysqlCore = require('./core/mysql');
const phpCore = require('./core/php');
const fsCore = require('./core/fs');
const sysinfoCore = require('./core/sysinfo');
const cronCore = require('./core/cron');
const ftpCore = require('./core/ftp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// --- INIT BACKGROUND SERVICES ---
// Start cron jobs on server start
setTimeout(() => cronCore.startAllJobs(), 1000);


// --- API ROUTES ---

app.get('/api/setup/status', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'success', requiresSetup: row.count === 0 });
    });
});

app.post('/api/setup/register', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) return res.status(403).json({ status: 'error', message: 'Setup is already complete' });

        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ status: 'error', message: 'Missing fields' });

        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
            if (err) return res.status(500).json({ status: 'error', message: err.message });
            res.json({ status: 'success', message: 'Admin account created successfully', token: 'mock-jwt-token' });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json({ status: 'success', token: 'mock-jwt-token' });
        else res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    });
});

app.get('/api/sysinfo', (req, res) => {
    try {
        const info = sysinfoCore.getSysInfo();
        res.json({ status: 'success', data: info });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.get('/api/domains', (req, res) => {
    db.all('SELECT * FROM domains ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'success', data: rows });
    });
});

app.post('/api/domains', async (req, res) => {
    const { domain_name } = req.body;
    if (!domain_name) return res.status(400).json({ status: 'error', message: 'Domain name is required' });

    try {
        db.run('INSERT INTO domains (domain_name, created_at) VALUES (?, ?)', [domain_name, new Date().toISOString()], async function(err) {
            if (err) return res.status(500).json({ status: 'error', message: err.message });
            try {
                await nginxCore.addDomain(domain_name);
                res.json({ status: 'success', message: `Domain ${domain_name} added successfully!` });
            } catch (nginxErr) {
                res.status(500).json({ status: 'error', message: 'Failed to configure Nginx', error: nginxErr.message });
            }
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/domains/ssl', async (req, res) => {
    const { domain_name } = req.body;
    try {
        const result = await nginxCore.enableSSL(domain_name);
        res.json(result);
    } catch (e) {
        res.status(500).json(e);
    }
});

app.get('/api/mysql/status', async (req, res) => {
    try {
        res.json({ status: 'success', data: await mysqlCore.checkMySQLInstalled() });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/mysql/install', async (req, res) => {
    try {
        res.json({ status: 'success', ...(await mysqlCore.installMySQL()) });
    } catch (e) { res.status(500).json({ status: 'error', ...e }); }
});

app.post('/api/mysql/databases', async (req, res) => {
    const { dbName, dbUser, dbPass } = req.body;
    try {
        res.json(await mysqlCore.createDatabase(dbName, dbUser, dbPass));
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.get('/api/php/status', async (req, res) => {
    try { res.json({ status: 'success', data: await phpCore.checkPHPInstalled() }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/php/install', async (req, res) => {
    try { res.json({ status: 'success', ...(await phpCore.installPHP()) }); }
    catch (e) { res.status(500).json({ status: 'error', ...e }); }
});

app.get('/api/fs/list', (req, res) => {
    try { res.json({ status: 'success', data: fsCore.listFiles(req.query.path || '/') }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.get('/api/fs/read', (req, res) => {
    try { res.json({ status: 'success', data: fsCore.readFileContent(req.query.path) }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/fs/write', (req, res) => {
    try { fsCore.writeFileContent(req.body.path, req.body.content); res.json({ status: 'success', message: 'File saved' }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/fs/delete', (req, res) => {
    try { fsCore.deleteItem(req.body.path); res.json({ status: 'success', message: 'Deleted' }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/fs/mkdir', (req, res) => {
    try { fsCore.createDirectory(req.body.path); res.json({ status: 'success', message: 'Directory created' }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.get('/api/cron', async (req, res) => {
    try { res.json({ status: 'success', data: await cronCore.getJobs() }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/cron', async (req, res) => {
    try { res.json({ status: 'success', data: await cronCore.addJob(req.body.schedule, req.body.command) }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.delete('/api/cron/:id', async (req, res) => {
    try { await cronCore.deleteJob(req.params.id); res.json({ status: 'success' }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.get('/api/ftp', async (req, res) => {
    try { res.json({ status: 'success', data: await ftpCore.getFtpUsers() }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/ftp', async (req, res) => {
    try { res.json({ status: 'success', data: await ftpCore.createFtpUser(req.body.username, req.body.password, req.body.domain) }); }
    catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.post('/api/ftp/install', async (req, res) => {
    try { res.json(await ftpCore.installVsftpd()); }
    catch (e) { res.status(500).json(e); }
});

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MyControlPanel Backend running on http://localhost:${PORT}`);
});
