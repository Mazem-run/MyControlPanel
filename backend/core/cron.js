const cron = require('node-cron');
const { exec } = require('child_process');
const db = require('../db/database');

const activeJobs = {};

function startAllJobs() {
    db.all('SELECT * FROM cron_jobs', [], (err, rows) => {
        if (err) {
            console.error('Failed to load cron jobs:', err.message);
            return;
        }
        rows.forEach(job => scheduleJob(job.id, job.schedule, job.command));
        console.log(`[Cron] Loaded ${rows.length} jobs.`);
    });
}

function scheduleJob(id, schedule, command) {
    // If job already exists, stop it first
    if (activeJobs[id]) {
        activeJobs[id].stop();
    }

    try {
        const task = cron.schedule(schedule, () => {
            console.log(`[Cron] Executing Job ${id}: ${command}`);
            exec(command, (error, stdout, stderr) => {
                if (error) console.error(`[Cron] Job ${id} Error:`, error.message);
                if (stdout) console.log(`[Cron] Job ${id} Output:`, stdout.trim());
            });
        });
        activeJobs[id] = task;
    } catch (e) {
        console.error(`[Cron] Failed to schedule job ${id}:`, e.message);
    }
}

function stopJob(id) {
    if (activeJobs[id]) {
        activeJobs[id].stop();
        delete activeJobs[id];
    }
}

function addJob(schedule, command) {
    return new Promise((resolve, reject) => {
        if (!cron.validate(schedule)) {
            return reject(new Error('Invalid cron schedule expression'));
        }
        db.run('INSERT INTO cron_jobs (schedule, command, created_at) VALUES (?, ?, ?)', [schedule, command, new Date().toISOString()], function(err) {
            if (err) return reject(err);
            const id = this.lastID;
            scheduleJob(id, schedule, command);
            resolve({ id, schedule, command });
        });
    });
}

function deleteJob(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM cron_jobs WHERE id = ?', [id], (err) => {
            if (err) return reject(err);
            stopJob(id);
            resolve();
        });
    });
}

function getJobs() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM cron_jobs ORDER BY id DESC', [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = {
    startAllJobs,
    addJob,
    deleteJob,
    getJobs
};
