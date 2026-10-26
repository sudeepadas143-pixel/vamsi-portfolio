#!/usr/bin/env node
// Downloads the portfolio's original media from the Framer CDN and writes
// web-optimised copies to public/media/. Requires ffmpeg and ImageMagick.
//
//   node scripts/media.mjs            process anything missing
//   node scripts/media.mjs --force    re-encode everything
//
// Rules:
//   .mp4  -> H.264 mp4 (<=1280px long edge, CRF 27, faststart) + .webp poster.
//            Audio is kept only for clips longer than 30s (trailers / walkthroughs).
//   .gif  -> silent looping H.264 mp4 + .webp poster (5-20x smaller than the GIF).
//   .png/.jpg -> .webp (<=1920px, q82, alpha preserved).
//   .svg  -> copied verbatim.
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CACHE = join(ROOT, '.cache', 'media-raw');
const OUT = join(ROOT, 'public', 'media');
const FORCE = process.argv.includes('--force');
const sources = JSON.parse(readFileSync(join(ROOT, 'src/data/media-sources.json'), 'utf8'));
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')}\n${r.stderr}`);
  return r.stdout;
}

async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function probe(file) {
  const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', file]);
  const j = JSON.parse(out);
  return { duration: parseFloat(j.format.duration || '0'), hasAudio: j.streams.some((s) => s.codec_type === 'audio') };
}

// Poster frame overrides (seconds) where the default frame is not representative.
const POSTER_AT = { C68RXlqYZEHmSyQSdQOWK06nI: 1.5 };

const SCALE = "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))',scale=trunc(iw/2)*2:trunc(ih/2)*2";

function poster(src, dest, at = 0.4) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-i', src, '-frames:v', '1', '-vf', SCALE, '-c:v', 'libwebp', '-quality', '78', dest]);
}

const manifest = {};
for (const url of sources) {
  const file = basename(new URL(url).pathname);
  const id = file.replace(extname(file), '');
  const ext = extname(file).toLowerCase();
  const raw = join(CACHE, file);
  await download(url, raw);
  const entry = { source: url };
  if (ext === '.mp4' || ext === '.gif') {
    const mp4 = join(OUT, `${id}.mp4`);
    const webp = join(OUT, `${id}.webp`);
    const { duration, hasAudio } = ext === '.mp4' ? probe(raw) : { duration: 0, hasAudio: false };
    const keepAudio = hasAudio && duration > 30;
    if (FORCE || !existsSync(mp4)) {
      const args = ['-y', '-v', 'error', '-i', raw, '-vf', SCALE, '-c:v', 'libx264', '-preset', 'slow', '-crf', ext === '.gif' ? '24' : '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
      if (keepAudio) args.push('-c:a', 'aac', '-b:a', '96k'); else args.push('-an');
      run('ffmpeg', [...args, mp4]);
    }
    if (FORCE || !existsSync(webp)) poster(raw, webp, POSTER_AT[id] ?? (ext === '.gif' ? 0 : Math.min(0.4, duration / 2)));
    Object.assign(entry, { type: 'video', src: `/media/${id}.mp4`, poster: `/media/${id}.webp`, fromGif: ext === '.gif', audio: keepAudio });
  } else if (ext === '.svg') {
    const out = join(OUT, file);
    if (FORCE || !existsSync(out)) writeFileSync(out, readFileSync(raw));
    Object.assign(entry, { type: 'image', src: `/media/${file}` });
  } else {
    const out = join(OUT, `${id}.webp`);
    if (FORCE || !existsSync(out)) run('convert', [raw, '-resize', '1920x1920>', '-quality', '82', '-define', 'webp:method=6', out]);
    Object.assign(entry, { type: 'image', src: `/media/${id}.webp` });
  }
  const dims = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', join(ROOT, 'public', entry.type === 'video' ? entry.poster : entry.src)]).trim().split(',');
  if (ext !== '.svg') { entry.width = +dims[0]; entry.height = +dims[1]; }
  manifest[id] = entry;
  process.stdout.write(`✓ ${id}${ext}\n`);
}
writeFileSync(join(ROOT, 'src/data/media.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`wrote ${Object.keys(manifest).length} entries to src/data/media.json`);
