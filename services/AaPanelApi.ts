import axios from 'axios';
import qs from 'qs';
import CryptoJS from 'crypto-js';

export interface SystemTotal {
  cpuNum: number;
  cpuRealUsed: number;
  isport: boolean;
  isuser: number;
  memBuffers: number;
  memCached: number;
  memFree: number;
  memRealUsed: number;
  memTotal: number;
  system: string;
  time: string;
  version: string;
}

export interface DiskInfo {
  filesystem: string;
  inodes: (string | number)[];
  path: string;
  size: (string | number)[];
  type: string;
}

export interface NetworkInfo {
  cpu: (number | string | number[])[];
  cpu_times: {
    active_processes: number;
    guest: number;
    guest_nice: number;
    idle: number;
    iowait: number;
    irq: number;
    nice: number;
    softirq: number;
    steal: number;
    system: number;
    total_processes: number;
    user: number;
  };
  database_total: number;
  disk: any[]; // You might want to define a more specific interface for disk if needed
  down: number;
  downPackets: number;
  downTotal: number;
  ftp_total: number;
  installed: boolean;
  iostat: { [key: string]: any }; // Define a more specific interface if needed
  load: {
    fifteen: number;
    five: number;
    limit: number;
    max: number;
    one: number;
    safe: number;
  };
  mem: {
    memBuffers: number;
    memCached: number;
    memFree: number;
    memRealUsed: number;
    memTotal: number;
  };
  network: { [key: string]: any }; // Define a more specific interface if needed
  site_total: number;
  system: string;
  time: string;
  title: string;
  up: number;
  upPackets: number;
  upTotal: number;
  user_info: {
    data: any; // Define a more specific interface if needed
    msg: string;
    status: boolean;
  };
  version: string;
}

export interface Site {
  id: number;
  name: string;
  path: string;
  status: string;
  ps: string;
  addtime: string;
  edate: string;
}

export class AaPanelApi {
  private PANEL_URL: string;
  private API_KEY: string;
  private cookie: string | null = null;

  constructor(panel_url: string, api_key: string) {
    if (!panel_url || !api_key) {
      throw new Error("Panel URL and API Key are required.");
    }
    this.PANEL_URL = panel_url;
    this.API_KEY = api_key;
  }

  private _md5(str: string): string {
    return CryptoJS.MD5(str.toString()).toString();
  }

  private _getSignature(): { request_time: number; request_token: string } {
    const request_time = Math.floor(Date.now() / 1000);
    const request_token = this._md5(String(request_time) + this._md5(this.API_KEY));
    return {
      request_time,
      request_token
    };
  }

  private async _request(endpoint: string, params: any = {}, timeout: number = 60000): Promise<any> {
    const url = `${this.PANEL_URL}${endpoint}`;
    
    const signature = this._getSignature();
    const postData = { ...params, ...signature };

    try {
      const response = await axios.post(url, qs.stringify(postData), {
        timeout,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Cookie': this.cookie || ''
        }
      });

      if (response.headers['set-cookie']) {
        this.cookie = response.headers['set-cookie'].join('; ');
      }
      
      if (typeof response.data === 'object') {
        return response.data;
      } else {
        try {
          return JSON.parse(response.data);
        } catch(e) {
          console.error("API response was not valid JSON:", response.data);
          throw new Error(`Invalid JSON response: ${response.data}`);
        }
      }

    } catch (err: any) {
      // Enhanced error handling with detailed messages
      let errorMessage = 'Unknown error occurred';
      
      if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        errorMessage = 'Network error: Unable to connect to the panel. Please check your internet connection and panel URL.';
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Request timeout: The panel is taking too long to respond. Please try again.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error: The panel is blocking requests from this app. Please check your panel CORS settings.';
      } else if (err.response) {
        const status = err.response.status;
        const statusText = err.response.statusText || 'Unknown';
        
        switch (status) {
          case 400:
            errorMessage = 'Bad Request: Invalid parameters sent to the panel.';
            break;
          case 401:
            errorMessage = 'Unauthorized: Invalid API key or authentication failed.';
            break;
          case 403:
            errorMessage = 'Forbidden: Access denied. Please check your API key permissions.';
            break;
          case 404:
            errorMessage = 'Not Found: The requested endpoint does not exist on the panel.';
            break;
          case 500:
            errorMessage = 'Internal Server Error: The panel encountered an error.';
            break;
          case 502:
            errorMessage = 'Bad Gateway: The panel server is not responding properly.';
            break;
          case 503:
            errorMessage = 'Service Unavailable: The panel is temporarily unavailable.';
            break;
          default:
            errorMessage = `HTTP ${status} ${statusText}: ${err.response.data || 'Unknown error'}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from panel: Please check if the panel URL is correct and accessible.';
      } else {
        errorMessage = `Request setup error: ${err.message}`;
      }
      
      console.error(`API request to ${url} failed:`, err);
      
      // Create a detailed error object
      const detailedError = new Error(errorMessage);
      (detailedError as any).originalError = err;
      (detailedError as any).endpoint = endpoint;
      (detailedError as any).panelUrl = this.PANEL_URL;
      throw err;
    }
  }

  async getSystemTotal(): Promise<SystemTotal> {
    return this._request('/system', { action: 'GetSystemTotal' });
  }

  async getDiskInfo(): Promise<DiskInfo[]> {
    return this._request('/system', { action: 'GetDiskInfo' });
  }

  async getNetWork(): Promise<NetworkInfo> {
    return this._request('/system', { action: 'GetNetWork' });
  }

  async getSites(options: any = {}): Promise<{ data: Site[]; page: string }> {
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

  async stopSite(id: number, name: string): Promise<any> {
    return this._request('/site', { action: 'SiteStop', id, name });
  }

  async startSite(id: number, name: string): Promise<any> {
    return this._request('/site', { action: 'SiteStart', id, name });
  }
}