const fs = require('fs');
const { execSync } = require('child_process');

const LOG_PATH = './log/access.log'; // 修改为你的日志路径
const THRESHOLD = 20;

const logData = fs.readFileSync(LOG_PATH, 'utf-8');
const lines = logData.split('\n');

const ip404Count = {};

lines.forEach(line => {
  if (line.includes('404') && line.includes('IP:')) {
    const ipMatch = line.match(/IP:\s*(\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
      const ip = ipMatch[1];
      ip404Count[ip] = (ip404Count[ip] || 0) + 1;
    }
  }
});

Object.entries(ip404Count).forEach(([ip, count]) => {
  if (count >= THRESHOLD) {
    try {
      console.log(`Blocking IP ${ip} with ${count} 404s`);
      execSync(`iptables -A INPUT -s ${ip} -j DROP`);
    } catch (err) {
      console.error(`Failed to block IP ${ip}:`, err.message);
    }
  }
});