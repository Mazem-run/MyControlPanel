const os = require('os');

function getSysInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    const loadAvg = os.loadavg();
    // Use 1 min load avg normalized by CPU count (simple approximation of CPU usage)
    const cpuCount = os.cpus().length;
    let cpuUsagePercent = ((loadAvg[0] / cpuCount) * 100).toFixed(1);
    if (cpuUsagePercent > 100) cpuUsagePercent = 100;

    const uptimeSeconds = os.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / (3600 * 24));
    const uptimeHours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
        cpuUsage: parseFloat(cpuUsagePercent),
        memUsage: parseFloat(memUsagePercent),
        totalMemGB: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
        usedMemGB: (usedMem / (1024 * 1024 * 1024)).toFixed(2),
        uptime: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
        os: `${os.type()} ${os.release()}`
    };
}

module.exports = {
    getSysInfo
};
