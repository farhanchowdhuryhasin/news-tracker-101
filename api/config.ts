import fs from 'fs';
import path from 'path';

const tempConfigPath = '/tmp/config.json';
const rootConfigPath = path.join(process.cwd(), 'config.json');

const DEFAULT_CONFIG = {
  url: '',
  siteName: 'worldnewstracker.online',
  siteTagline: 'Live Global Intelligence & Breaking Headlines',
  logoUrl: '',
};

const LEGACY_NAMES = new Set([
  'World News Tracker Online',
  'World Latest News Tracker',
  'News Tracker',
  'World News Tracker'
]);

function sanitizeConfig(config: any) {
  if (!config) return DEFAULT_CONFIG;
  if (!config.siteName || LEGACY_NAMES.has(String(config.siteName).trim())) {
    config.siteName = 'worldnewstracker.online';
  }
  return config;
}

function readConfig() {
  try {
    if (fs.existsSync(tempConfigPath)) {
      const raw = fs.readFileSync(tempConfigPath, 'utf-8');
      return sanitizeConfig(JSON.parse(raw));
    }
  } catch {}

  try {
    if (fs.existsSync(rootConfigPath)) {
      const raw = fs.readFileSync(rootConfigPath, 'utf-8');
      return sanitizeConfig(JSON.parse(raw));
    }
  } catch {}

  return DEFAULT_CONFIG;
}

function writeConfig(data: any) {
  const json = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(tempConfigPath, json);
  } catch {}
  try {
    fs.writeFileSync(rootConfigPath, json);
  } catch {}
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const config = readConfig();
      return res.status(200).json(config);
    } catch (e: any) {
      return res.status(200).json(DEFAULT_CONFIG);
    }
  }

  if (req.method === 'POST') {
    try {
      let data = req.body;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {}
      }

      const existingData = readConfig();
      const newData = {
        ...existingData,
        ...data,
      };

      writeConfig(newData);
      return res.status(200).json({ success: true, config: newData });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to save config', details: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
