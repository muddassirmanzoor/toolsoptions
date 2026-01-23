/**
 * Helper module to record processed files in Laravel database
 * This is called after a file is successfully processed
 */

const https = require('https');
const http = require('http');

/**
 * Record a processed file in Laravel database
 * @param {Object} options - File processing details
 * @param {number} options.userId - User ID (optional, defaults to 1 for guest)
 * @param {string} options.toolName - Name of the tool used (e.g., "Compress PDF", "Merge PDF")
 * @param {number} options.fileCount - Number of files processed
 * @param {string} options.status - Status: 'pending', 'processing', 'completed', 'failed'
 * @param {string} options.filePath - Path where the file is stored (relative to Laravel storage)
 * @param {string} options.originalFilename - Original filename
 * @param {Object} options.metadata - Additional metadata (optional)
 * @param {string} options.laravelUrl - Laravel API base URL (default: http://localhost:8000)
 */
async function recordProcessedFile(options) {
    const {
        userId = 1, // Default to user ID 1 if not provided
        toolName,
        fileCount = 1,
        status = 'completed',
        filePath = null,
        originalFilename = null,
        metadata = {},
        laravelUrl = process.env.LARAVEL_API_URL || 'http://82.180.132.134:8000/admin'
    } = options;

    if (!toolName) {
        console.error('recordProcessedFile: toolName is required');
        return false;
    }

    const data = JSON.stringify({
        user_id: userId,
        tool_name: toolName,
        file_count: fileCount,
        status: status,
        file_path: filePath,
        original_filename: originalFilename,
        metadata: metadata
    });

    const url = new URL(`${laravelUrl}/api/processed-files`);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options_http = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Accept': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = httpModule.request(options_http, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✓ Processed file recorded: ${toolName} (${fileCount} file(s))`);
                    resolve(true);
                } else {
                    console.error(`✗ Failed to record processed file. Status: ${res.statusCode}`);
                    console.error('Response:', responseData);
                    resolve(false); // Don't reject, just log error
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error calling Laravel API:', error.message);
            resolve(false); // Don't reject, just log error
        });

        req.write(data);
        req.end();
    });
}

module.exports = { recordProcessedFile };
