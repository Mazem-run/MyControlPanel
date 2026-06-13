const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
// The root directory that the File Manager is locked to.
// Users cannot escape this directory.
const ROOT_DIR = isWindows 
    ? path.join(__dirname, '..', 'websites_data') 
    : '/var/www';

// Ensure ROOT_DIR exists
if (!fs.existsSync(ROOT_DIR)) {
    fs.mkdirSync(ROOT_DIR, { recursive: true });
}

// Security function to prevent Directory Traversal attacks (e.g. using ../../)
function resolveSafePath(targetPath) {
    // targetPath comes from API, e.g. "/test.local/html/index.php"
    if (!targetPath) targetPath = '/';
    
    // Normalize and join with ROOT_DIR
    const absolutePath = path.resolve(ROOT_DIR, '.' + targetPath);
    
    // Check if it starts with ROOT_DIR
    if (!absolutePath.startsWith(ROOT_DIR)) {
        throw new Error('Access denied: Invalid path.');
    }
    return absolutePath;
}

function listFiles(targetPath) {
    const safePath = resolveSafePath(targetPath);
    
    if (!fs.existsSync(safePath)) {
        throw new Error('Directory not found');
    }

    const items = fs.readdirSync(safePath, { withFileTypes: true });
    
    return items.map(item => {
        const itemStats = fs.statSync(path.join(safePath, item.name));
        return {
            name: item.name,
            isDirectory: item.isDirectory(),
            size: itemStats.size,
            updatedAt: itemStats.mtime
        };
    }).sort((a, b) => {
        // Folders first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
    });
}

function readFileContent(targetPath) {
    const safePath = resolveSafePath(targetPath);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
        throw new Error('File not found or is a directory');
    }
    return fs.readFileSync(safePath, 'utf8');
}

function writeFileContent(targetPath, content) {
    const safePath = resolveSafePath(targetPath);
    fs.writeFileSync(safePath, content, 'utf8');
}

function deleteItem(targetPath) {
    const safePath = resolveSafePath(targetPath);
    if (!fs.existsSync(safePath)) {
        throw new Error('Item not found');
    }
    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) {
        fs.rmSync(safePath, { recursive: true, force: true });
    } else {
        fs.unlinkSync(safePath);
    }
}

function createDirectory(targetPath) {
    const safePath = resolveSafePath(targetPath);
    if (fs.existsSync(safePath)) {
        throw new Error('Directory already exists');
    }
    fs.mkdirSync(safePath, { recursive: true });
}

module.exports = {
    ROOT_DIR,
    listFiles,
    readFileContent,
    writeFileContent,
    deleteItem,
    createDirectory
};
