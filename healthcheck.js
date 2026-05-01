#!/usr/bin/env node
const http = require('http');

const options = {
  timeout: 2000,
  host: 'localhost',
  port: process.env.APP_PORT || 3000,
  path: '/health',
};

const req = http.request(options, (res) => {
  // 2xx and 3xx = healthy
  if (res.statusCode >= 200 && res.statusCode < 400) {
    process.exit(0);
  }
  // 404 = endpoint not implemented yet, still healthy
  else if (res.statusCode === 404) {
    process.exit(0);
  } else {
    console.error(`Healthcheck failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('Healthcheck error:', err.message);
  process.exit(1);
});

req.end();
