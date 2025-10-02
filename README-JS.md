# Tiny File Manager - JavaScript Edition

A simple JavaScript/Node.js translation of the PHP Tiny File Manager. This version provides a lightweight web interface for browsing and managing files through your browser.

## Features

- 📁 **File Browsing**: Navigate through directories with an intuitive interface
- 🔐 **Simple Authentication**: Login system to protect your files
- 📥 **File Download**: Download files directly from the browser
- 👁️ **File Preview**: View text files, images, and other supported formats
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚀 **Easy Setup**: Single file, no dependencies except Node.js

## Requirements

- Node.js 12.0 or higher (no additional npm packages required - uses only built-in modules)

## Installation & Usage

1. **Download the file:**
   ```bash
   wget https://raw.githubusercontent.com/P4X-ng/tinyfilemanager/master/tinyfilemanager.js
   # or
   curl -O https://raw.githubusercontent.com/P4X-ng/tinyfilemanager/master/tinyfilemanager.js
   ```

2. **Make it executable (optional):**
   ```bash
   chmod +x tinyfilemanager.js
   ```

3. **Run the server:**
   ```bash
   # Run with default settings (port 8080, current directory)
   node tinyfilemanager.js

   # Or specify port and directory
   node tinyfilemanager.js 3000 /path/to/directory
   
   # If made executable:
   ./tinyfilemanager.js 3000 /path/to/directory
   ```

4. **Access the interface:**
   - Open your browser and navigate to: `http://localhost:8080`
   - Default credentials:
     - Username: `admin`
     - Password: `admin@123`

## Command Line Arguments

```bash
node tinyfilemanager.js [port] [directory]
```

- `port` (optional): Port number to run the server on (default: 8080)
- `directory` (optional): Root directory to serve files from (default: current directory)

## Examples

```bash
# Run on port 8080, serve current directory
node tinyfilemanager.js

# Run on port 3000, serve current directory
node tinyfilemanager.js 3000

# Run on port 8080, serve /var/www
node tinyfilemanager.js 8080 /var/www

# Run on custom port and directory
node tinyfilemanager.js 9000 /home/user/documents
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Password**: The default password is `admin@123`. For production use, modify the authentication logic in the code.

2. **Use HTTPS**: This version uses HTTP. For production, consider putting it behind a reverse proxy (nginx, Apache) with SSL/TLS.

3. **Firewall**: Don't expose the server directly to the internet without proper firewall rules.

4. **Access Control**: The server only allows access within the specified root directory (path traversal protection included).

## Configuration

To customize the application, edit these values in `tinyfilemanager.js`:

```javascript
const CONFIG = {
    port: 8080,                    // Default port
    rootPath: process.cwd(),       // Default root directory
    appTitle: 'Tiny File Manager', // Application title
    version: '2.6-js',            // Version
    useAuth: true,                 // Enable/disable authentication
    users: {
        admin: 'admin@123'         // Username: password pairs
    }
};
```

## Differences from PHP Version

This JavaScript version is a **simplified translation** focused on core functionality:

### Included Features:
- ✅ File and directory browsing
- ✅ File download
- ✅ File viewing (text, images, etc.)
- ✅ Basic authentication
- ✅ Breadcrumb navigation
- ✅ Responsive UI with Bootstrap 5

### Not Included (to keep it simple):
- ❌ File upload
- ❌ File editing
- ❌ File/folder creation, deletion, renaming
- ❌ Archive operations (zip/tar)
- ❌ Advanced permissions
- ❌ Multi-language support
- ❌ CSRF protection
- ❌ Session persistence (uses in-memory sessions)

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## License

Available under the GNU General Public License - same as the original PHP version.

## Credits

- Original PHP version by [CCP Programmers](https://github.com/prasathmani/tinyfilemanager)
- JavaScript translation maintains the spirit and design of the original
- Uses Bootstrap 5 and Font Awesome for UI

## Support

For issues specific to this JavaScript version, please file an issue on the GitHub repository.

For the full-featured PHP version, visit: https://github.com/prasathmani/tinyfilemanager

## Quick Start Example

```bash
# Create a test directory
mkdir ~/file-manager-test
cd ~/file-manager-test

# Download the script
curl -O https://raw.githubusercontent.com/P4X-ng/tinyfilemanager/master/tinyfilemanager.js

# Run it
node tinyfilemanager.js

# Open browser to http://localhost:8080
# Login with admin/admin@123
```

Enjoy your lightweight file manager! 🚀
