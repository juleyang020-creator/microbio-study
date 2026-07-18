#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(label, command, args) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`${label} 无法启动：${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${label} 未通过。`);
    process.exit(result.status || 1);
  }
}

run('内容自检', process.execPath, ['tools/audit-content.mjs']);
run('示意图检查', process.execPath, ['tools/lint-svg.mjs']);
run('离线预缓存清单', process.execPath, ['tools/sync-sw-images.mjs', '--check']);
run('自动测试', process.execPath, ['--test']);
run('空白字符检查', 'git', ['diff', '--check']);

console.log('\n发布前检查通过。');
