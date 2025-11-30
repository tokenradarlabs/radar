import fs from 'fs';
import path from 'path';

const envFilePath = path.resolve(__dirname, '../../.env.test');

if (fs.existsSync(envFilePath)) {
  const envConfig = fs.readFileSync(envFilePath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}
