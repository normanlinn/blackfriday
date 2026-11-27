import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiDir = path.join(root, 'src', 'app', 'api');
const backupDir = path.join('/tmp', `vf-api-backup-${Date.now()}`);

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, backupDir);
  }
  execSync('NEXT_EXPORT_STATIC=1 npx next build', {
    stdio: 'inherit',
    env: { ...process.env, NEXT_EXPORT_STATIC: '1' },
  });
} finally {
  if (fs.existsSync(backupDir)) {
    fs.renameSync(backupDir, apiDir);
  }
}
