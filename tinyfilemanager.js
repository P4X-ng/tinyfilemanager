#!/usr/bin/env node

/**
 * Tiny File Manager - JavaScript/Node.js Version
 * A simple translation of the PHP file manager to JavaScript
 * Serves a web interface for browsing and managing files
 * 
 * Usage: node tinyfilemanager.js [port] [root-directory]
 * Default port: 8080
 * Default directory: current directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Configuration
const CONFIG = {
    port: process.argv[2] || 8080,
    rootPath: path.resolve(process.argv[3] || process.cwd()),
    appTitle: 'Tiny File Manager',
    version: '2.6-js',
    useAuth: true,
    // Default credentials: admin/admin@123
    users: {
        admin: '$2y$10$/K.hjNr84lLNDt8fTXjoI.DBp6PpeyoJ.mGwrrLuCZfAwfSAGqhOW'
    }
};

// Session storage (in-memory for simplicity)
const sessions = new Map();

// Helper functions
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function getFileIcon(filename, isDir) {
    if (isDir) return 'fa-folder';
    const ext = path.extname(filename).toLowerCase();
    const iconMap = {
        '.jpg': 'fa-file-image-o',
        '.jpeg': 'fa-file-image-o',
        '.png': 'fa-file-image-o',
        '.gif': 'fa-file-image-o',
        '.svg': 'fa-file-image-o',
        '.pdf': 'fa-file-pdf-o',
        '.doc': 'fa-file-word-o',
        '.docx': 'fa-file-word-o',
        '.xls': 'fa-file-excel-o',
        '.xlsx': 'fa-file-excel-o',
        '.zip': 'fa-file-archive-o',
        '.rar': 'fa-file-archive-o',
        '.tar': 'fa-file-archive-o',
        '.gz': 'fa-file-archive-o',
        '.mp3': 'fa-file-audio-o',
        '.wav': 'fa-file-audio-o',
        '.mp4': 'fa-file-video-o',
        '.avi': 'fa-file-video-o',
        '.mov': 'fa-file-video-o',
        '.js': 'fa-file-code-o',
        '.html': 'fa-file-code-o',
        '.css': 'fa-file-code-o',
        '.php': 'fa-file-code-o',
        '.json': 'fa-file-code-o',
        '.xml': 'fa-file-code-o',
        '.txt': 'fa-file-text-o'
    };
    return iconMap[ext] || 'fa-file-o';
}

function cleanPath(inputPath) {
    // Remove any path traversal attempts
    return inputPath.replace(/\.\./g, '').replace(/^\/+/, '');
}

function isPathAllowed(requestedPath) {
    const absolute = path.resolve(CONFIG.rootPath, requestedPath);
    return absolute.startsWith(CONFIG.rootPath);
}

// Generate HTML pages
function generateLoginPage() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>${CONFIG.appTitle}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card-wrapper {
            max-width: 400px;
            width: 100%;
        }
        .card {
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .brand {
            text-align: center;
            margin-bottom: 20px;
        }
        .brand h1 {
            font-size: 3em;
            font-weight: 700;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="card-wrapper">
        <div class="card">
            <div class="card-body p-5">
                <div class="brand">
                    <h1>H3K</h1>
                    <p class="text-muted">${CONFIG.appTitle}</p>
                </div>
                <hr>
                <form method="POST" action="/">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" name="username" required autofocus>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Sign in</button>
                </form>
            </div>
        </div>
        <div class="text-center text-white mt-3">
            <small>&copy; <a href="https://tinyfilemanager.github.io/" class="text-white">CCP Programmers</a> - v${CONFIG.version}</small>
        </div>
    </div>
</body>
</html>`;
}

function generateFileListPage(currentPath, files) {
    const breadcrumbs = currentPath.split('/').filter(p => p);
    let breadcrumbHTML = `<li class="breadcrumb-item"><a href="/?p=">Home</a></li>`;
    let cumulativePath = '';
    
    breadcrumbs.forEach(crumb => {
        cumulativePath += '/' + crumb;
        breadcrumbHTML += `<li class="breadcrumb-item"><a href="/?p=${encodeURIComponent(cumulativePath)}">${crumb}</a></li>`;
    });

    let filesHTML = '';
    files.forEach(file => {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
        const icon = getFileIcon(file.name, file.isDir);
        const sizeStr = file.isDir ? '--' : formatSize(file.size);
        const dateStr = formatDate(file.mtime);
        
        if (file.isDir) {
            filesHTML += `
            <tr>
                <td><i class="fa ${icon} text-info"></i> <a href="/?p=${encodeURIComponent(filePath)}">${file.name}</a></td>
                <td>${sizeStr}</td>
                <td>${dateStr}</td>
                <td>
                    <a href="/?p=${encodeURIComponent(filePath)}" class="btn btn-sm btn-outline-primary" title="Open">
                        <i class="fa fa-folder-open"></i>
                    </a>
                </td>
            </tr>`;
        } else {
            filesHTML += `
            <tr>
                <td><i class="fa ${icon}"></i> ${file.name}</td>
                <td>${sizeStr}</td>
                <td>${dateStr}</td>
                <td>
                    <a href="/download?f=${encodeURIComponent(filePath)}" class="btn btn-sm btn-outline-success" title="Download">
                        <i class="fa fa-download"></i>
                    </a>
                    <a href="/view?f=${encodeURIComponent(filePath)}" class="btn btn-sm btn-outline-info" title="View" target="_blank">
                        <i class="fa fa-eye"></i>
                    </a>
                </td>
            </tr>`;
        }
    });

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${CONFIG.appTitle}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <style>
        body {
            font-size: 15px;
            color: #222;
            background: #F7F7F7;
            padding-top: 70px;
        }
        .navbar {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .breadcrumb {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .table-responsive {
            background: white;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .table td, .table th {
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">
                <i class="fa fa-file-o"></i> ${CONFIG.appTitle}
            </a>
            <div class="d-flex">
                <span class="navbar-text text-white me-3">
                    <i class="fa fa-folder"></i> ${currentPath || '/'}
                </span>
                <a href="/logout" class="btn btn-outline-light btn-sm">
                    <i class="fa fa-sign-out"></i> Logout
                </a>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                ${breadcrumbHTML}
            </ol>
        </nav>

        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Name</th>
                        <th style="width: 150px;">Size</th>
                        <th style="width: 200px;">Modified</th>
                        <th style="width: 150px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filesHTML || '<tr><td colspan="4" class="text-center text-muted">No files found</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="mt-3 text-center text-muted">
            <small>
                <i class="fa fa-info-circle"></i> 
                Serving from: ${CONFIG.rootPath}
            </small>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

// Request handlers
function handleLogin(req, res, postData) {
    try {
        const params = new URLSearchParams(postData);
        const username = params.get('username');
        const password = params.get('password');

        // Simple authentication (in production, use proper password hashing)
        if (username === 'admin' && password === 'admin@123') {
            const sessionId = generateToken();
            sessions.set(sessionId, { username, authenticated: true });
            
            res.writeHead(302, {
                'Set-Cookie': `TINYFILEMANAGER_SID=${sessionId}; Path=/; HttpOnly`,
                'Location': '/'
            });
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(generateLoginPage());
        }
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

function handleLogout(req, res, sessionId) {
    if (sessionId) {
        sessions.delete(sessionId);
    }
    res.writeHead(302, {
        'Set-Cookie': 'TINYFILEMANAGER_SID=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'Location': '/'
    });
    res.end();
}

function handleFileList(req, res, requestedPath) {
    const cleanedPath = cleanPath(requestedPath);
    const fullPath = path.join(CONFIG.rootPath, cleanedPath);

    if (!isPathAllowed(cleanedPath)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Access denied');
        return;
    }

    if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Directory not found');
        return;
    }

    try {
        const items = fs.readdirSync(fullPath);
        const files = [];

        items.forEach(item => {
            try {
                const itemPath = path.join(fullPath, item);
                const stats = fs.statSync(itemPath);
                files.push({
                    name: item,
                    isDir: stats.isDirectory(),
                    size: stats.size,
                    mtime: stats.mtime
                });
            } catch (err) {
                // Skip items that can't be read
            }
        });

        // Sort: directories first, then files
        files.sort((a, b) => {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generateFileListPage(cleanedPath, files));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading directory: ' + err.message);
    }
}

function handleDownload(req, res, requestedPath) {
    const cleanedPath = cleanPath(requestedPath);
    const fullPath = path.join(CONFIG.rootPath, cleanedPath);

    if (!isPathAllowed(cleanedPath) || !fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Cannot download directory');
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`,
        'Content-Length': stats.size
    });

    const readStream = fs.createReadStream(fullPath);
    readStream.pipe(res);
}

function handleView(req, res, requestedPath) {
    const cleanedPath = cleanPath(requestedPath);
    const fullPath = path.join(CONFIG.rootPath, cleanedPath);

    if (!isPathAllowed(cleanedPath) || !fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.xml': 'text/xml',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf'
    };

    const contentType = mimeTypes[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    
    const readStream = fs.createReadStream(fullPath);
    readStream.pipe(res);
}

function getSessionId(req) {
    const cookies = req.headers.cookie;
    if (!cookies) return null;
    
    const match = cookies.match(/TINYFILEMANAGER_SID=([^;]+)/);
    return match ? match[1] : null;
}

function isAuthenticated(req) {
    if (!CONFIG.useAuth) return true;
    
    const sessionId = getSessionId(req);
    if (!sessionId) return false;
    
    const session = sessions.get(sessionId);
    return session && session.authenticated;
}

// Main server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Handle logout
    if (pathname === '/logout') {
        handleLogout(req, res, getSessionId(req));
        return;
    }

    // Check authentication
    if (!isAuthenticated(req)) {
        if (req.method === 'POST' && pathname === '/') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                handleLogin(req, res, body);
            });
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(generateLoginPage());
        }
        return;
    }

    // Handle authenticated requests
    if (pathname === '/' || pathname === '') {
        const requestedPath = query.p || '';
        handleFileList(req, res, requestedPath);
    } else if (pathname === '/download') {
        const requestedPath = query.f || '';
        handleDownload(req, res, requestedPath);
    } else if (pathname === '/view') {
        const requestedPath = query.f || '';
        handleView(req, res, requestedPath);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start server
server.listen(CONFIG.port, () => {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Tiny File Manager - JavaScript Edition     ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
    console.log(`Server running at http://localhost:${CONFIG.port}/`);
    console.log(`Root directory: ${CONFIG.rootPath}`);
    console.log('');
    console.log('Default credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin@123');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});
