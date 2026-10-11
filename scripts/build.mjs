import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const publicFiles = [
  'index.html',
  'undangan_ngunduh_mantu_digital.html',
  'catin pria.jpeg',
  'catin wanita.jpeg',
  'foto 1.jpeg',
  'foto 2.jpeg',
  'foto 3.jpeg',
  'foto 4.jpeg',
  'foto 5.jpeg',
  'Foto 6.jpeg',
  'foto 7.jpg',
  'laguku ketaton cinta.mp3',
  'pembuat_link_tamu.html',
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) await cp(resolve(root, file), resolve(output, file));
