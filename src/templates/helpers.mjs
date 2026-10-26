import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const media = JSON.parse(readFileSync(fileURLToPath(new URL('../data/media.json', import.meta.url)), 'utf8'));

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== false && v !== null)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(' ');

export function mediaInfo(id) {
  const m = media[id];
  if (!m) throw new Error(`Unknown media id: ${id}`);
  return m;
}

const isExternal = (href) => /^(https?:|mailto:|tel:)/.test(href);

// Normalise links copied from the Framer export ("./x", "../x") to root-relative paths.
export function normHref(href) {
  if (!href || isExternal(href) || href.startsWith('#')) return href;
  return '/' + href.replace(/^(\.\.?\/)+/, '').replace(/^\//, '');
}

export function link(href, inner, extra = {}) {
  const h = normHref(href);
  const ext = isExternal(h) && !h.startsWith('mailto:') && !h.startsWith('tel:');
  return `<a ${attrs({ href: h, target: ext ? '_blank' : undefined, rel: ext ? 'noopener' : undefined, ...extra })}>${inner}</a>`;
}

// Minimal inline markup used by the extracted copy: **bold**, _italic_, [text](href), newlines.
export function inline(text) {
  let s = esc(text);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => link(h.replace(/&amp;/g, '&'), t));
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(>])_([\s\S]+?)_(?=$|[\s.,;:!?)<])/g, '$1<em>$2</em>');
  return s.replace(/\n/g, '<br>');
}

// Split text into per-character spans for the staggered "appear" text effect.
export function letters(text, cls = 'ch') {
  return [...text]
    .map((c, i) => (c === ' ' ? ' ' : `<span class="${cls}" style="--i:${i}" aria-hidden="true">${esc(c)}</span>`))
    .join('');
}

export function words(text, cls = 'wd') {
  return text
    .split(' ')
    .map((w, i) => `<span class="${cls}" style="--i:${i}" aria-hidden="true">${esc(w)}</span>`)
    .join(' ');
}

export function img(id, { alt = '', cls, loading = 'lazy', sizes, style } = {}) {
  const m = mediaInfo(id);
  if (m.type === 'video') return video(id, { cls, style, alt });
  return `<img ${attrs({ src: m.src, alt, width: m.width, height: m.height, loading, decoding: 'async', class: cls, sizes, style })}>`;
}

// Videos (and GIFs converted to video) autoplay muted/looping once in view.
export function video(id, { cls, style, controls = false, alt = '', autoplay = true, eager = false } = {}) {
  const m = mediaInfo(id);
  return `<video ${attrs({
    class: cls, style, poster: m.poster, width: m.width, height: m.height,
    muted: !controls, loop: !controls, playsinline: true, controls,
    preload: eager ? 'auto' : 'none', 'data-autoplay': autoplay && !controls ? '' : undefined,
    'aria-label': alt || undefined, 'data-src': eager ? undefined : m.src, src: eager ? m.src : undefined,
  })}></video>`;
}
