import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiDir = path.join(root, 'src', 'app', 'api');
// API routes can't be statically exported, so move them aside during the build.
// Keep the backup next to the project so the rename never crosses filesystems.
const backupDir = path.join(root, `.api-backup-${Date.now()}`);

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
