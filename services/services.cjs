/**
 * aaPanel API Client for Node.js & React Native
 * * This class provides methods to interact with the aaPanel API, based on the official documentation.
 * It handles request signing and cookie management.
 * * This version is modified to be compatible with React Native by removing Node.js-specific dependencies (fs, path, crypto).
 * * @see Based on the documentation provided in 'api.pdf'.
 * * @dependency axios
 * * @dependency qs
 * * @dependency crypto-js (for MD5 hashing in non-Node.js environments)
 */

const axios = require('axios');
const qs = require('qs');
const CryptoJS = require('crypto-js');

class AaPanelApi {
    /**
     * Initializes the API client.
     * @param {string} panel_url - The base URL of your aaPanel instance (e.g., "https://192.168.1.245:7800").
     * @param {string} api_key - The API key from your panel's settings page.
     */
    constructor(panel_url, api_key) {
        if (!panel_url || !api_key) {
            throw new Error("Panel URL and API Key are required.");
        }
        this.PANEL_URL = panel_url;
        this.API_KEY = api_key;
        
        // In-memory storage for the session cookie.
        // For persistence in React Native, you could extend this to use AsyncStorage.
        this.cookie = null;
    }

    /**
     * Generates an MD5 hash of a string using crypto-js.
     * @param {string} str - The string to hash.
     * @returns {string} The MD5 hash.
     * @private
     */
    _md5(str) {
        return CryptoJS.MD5(str.toString()).toString();
    }

    /**
     * Prepares the required signature data for an API request.
     * This is the core authentication mechanism.
     * @returns {{request_time: number, request_token: string}} The signature data.
     * @private
     */
    _getSignature() {
        const request_time = Math.floor(Date.now() / 1000);
        // The signature is md5(request_time + md5(api_key)).
        // It's crucial to convert request_time to a string before concatenation.
        const request_token = this._md5(String(request_time) + this._md5(this.API_KEY));
        return {
            request_time,
            request_token
        };
    }

    /**
     * Performs a POST request to a specified API endpoint.
     * This is the main internal method for all API calls.
     * @param {string} endpoint - The API endpoint path (e.g., "/system").
     * @param {object} params - The parameters for the API action.
     * @param {number} timeout - Request timeout in milliseconds.
     * @returns {Promise<object|null>} A promise that resolves with the JSON response data, or null on error.
     * @private
     */
    async _request(endpoint, params = {}, timeout = 60000) {
        const url = `${this.PANEL_URL}${endpoint}`;
        
        // Combine user parameters with the required signature.
        const signature = this._getSignature();
        const postData = { ...params, ...signature };

        try {
            // Make the request using the in-memory cookie.
            const response = await axios.post(url, qs.stringify(postData), {
                timeout,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'Cookie': this.cookie || ''
                }
            });

            // If the panel sends back a cookie, save it in memory for subsequent requests.
            if (response.headers['set-cookie']) {
                this.cookie = response.headers['set-cookie'].join('; ');
            }
            
            // The API should always return JSON, but can sometimes return other data on error.
            if (typeof response.data === 'object') {
                return response.data;
            } else {
                // Attempt to parse if it's a JSON string, otherwise return as is.
                try {
                    return JSON.parse(response.data);
                } catch(e) {
                    console.error("API response was not valid JSON:", response.data);
                    return null;
                }
            }

        } catch (err) {
            console.error(`API request to ${url} failed:`, err.message);
            if (err.response) {
                console.error("Response Status:", err.response.status);
                console.error("Response Data:", err.response.data);
            }
            return null;
        }
    }

    // --- System Status Endpoints ---

    /**
     * Gets basic system statistics (OS, CPU, Memory).
     * @returns {Promise<object|null>} System statistics object.
     */
    async getSystemTotal() {
        return this._request('/system', { action: 'GetSystemTotal' });
    }

    /**
     * Gets disk partition information.
     * @returns {Promise<object|null>} Disk information array.
     */
    async getDiskInfo() {
        return this._request('/system', { action: 'GetDiskInfo' });
    }

    /**
     * Gets real-time status (CPU, memory, network, load).
     * @returns {Promise<object|null>} Network and load statistics.
     */
    async getNetWork() {
        return this._request('/system', { action: 'GetNetWork' });
    }

    // --- Website Management Endpoints ---

    /**
     * Gets a list of websites.
     * @param {object} [options] - Optional parameters.
     * @param {number} [options.p=1] - The page number.
     * @param {number} [options.limit=15] - The number of results per page.
     * @param {string} [options.search=''] - Search keyword.
     * @param {number} [options.type=-1] - Site type ID.
     * @returns {Promise<object|null>} A list of sites and pagination info.
     */
    async getSites(options = {}) {
        const params = {
            action: 'getData',
            table: 'sites',
            p: options.p || 1,
            limit: options.limit || 15,
            search: options.search || '',
            type: options.type !== undefined ? options.type : -1
        };
        return this._request('/data', params);
    }
    
    /**
     * Gets a list of logs.
     * @param {number} [limit=10] - The number of log entries to retrieve.
     * @returns {Promise<object|null>} A list of logs.
     */
    async getLogs(limit = 10) {
        const params = {
            action: 'getData',
            table: 'logs',
            limit: limit,
            tojs: 'test'
        };
        return this._request('/data', params);
    }

    /**
     * Stops a website.
     * @param {number} id - The ID of the website.
     * @param {string} name - The name (main domain) of the website.
     * @returns {Promise<object|null>} The result of the operation.
     */
    async stopSite(id, name) {
        return this._request('/site', { action: 'SiteStop', id, name });
    }

    /**
     * Starts a website.
     * @param {number} id - The ID of the website.
     * @param {string} name - The name (main domain) of the website.
     * @returns {Promise<object|null>} The result of the operation.
     */
    async startSite(id, name) {
        return this._request('/site', { action: 'SiteStart', id, name });
    }
}

module.exports = AaPanelApi;
