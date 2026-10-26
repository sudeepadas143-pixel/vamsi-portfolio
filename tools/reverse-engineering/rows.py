# Convert measured atoms (content.json) into row/column layout data for case studies.
import json, re, sys, os
S = os.environ.get('REF_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.cache/ref'))
REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')
content = json.load(open(f'{S}/content.json'))
boxes = json.load(open(f'{S}/boxes.json'))
lines = {  # measured 1px dividers (rgba(240,240,240,.1)) after reveal, from lines.cjs
 '/projects/delumination': [1461, 2369, 3233, 3622, 4330],
 '/furscape': [1407, 2036, 2784, 3248, 4277],
 '/castle-infiltration': [1198, 1992, 2602, 3355, 3992, 5249],
 '/pier-extract': [1209, 2034, 2745, 3628, 5215, 6057],
 '/work/darkfen---darkfen': [1298, 1924, 2536, 4222, 4867, 5531, 6015, 6696, 7593, 8097, 8809, 9399, 9931, 10264],
}
PAGES = {
 '/projects/delumination': 'delumination', '/furscape': 'furscape', '/castle-infiltration': 'castle-infiltration',
 '/pier-extract': 'pier-extract', '/work/darkfen---darkfen': 'darkfen',
}
DOMDIR = {'/projects/delumination': 'projects__delumination', '/furscape': 'furscape', '/castle-infiltration': 'castle-infiltration', '/pier-extract': 'pier-extract', '/work/darkfen---darkfen': 'work__darkfen---darkfen'}

def media_id(url):
    m = re.search(r'framerusercontent\.com/(?:images|assets)/([A-Za-z0-9_-]+)\.', url)
    return m.group(1) if m else None

COLORS = {'rgb(224, 241, 31)': 'accent', 'rgb(240, 240, 240)': 'fg', 'rgba(240, 240, 240, 0.3)': 'fg-30', 'rgba(240, 240, 240, 0.5)': 'fg-50',
          'rgb(255, 34, 68)': 'alert', 'rgb(18, 18, 18)': 'bg', 'rgb(230, 230, 230)': 'fg-90', 'rgb(255, 255, 255)': 'white'}
FAM = {'Inter': 'inter', 'DM Sans': 'dm', 'Big Shoulders': 'bs', 'Geist': 'geist', 'Unbounded': 'unbounded'}

def font_of(a, dom):
    m = re.match(r'(.+?) ([\d.]+)px (\d+) (rgba?\([^)]*\)) (\w+)', a['font'])
    fam, size, weight, color, align = m.groups()
    lh, ls = None, None
    for it in dom:
        if abs(it['x'] - a['x']) <= 4 and abs(it['y'] - a['y']) <= 6 and it['fs'] == f'{size}px' and it['text'][:12].replace(' ', '\n')[:6] == re.sub(r'[*_\[]', '', a['text'])[:6]:
            lh, ls = it['lh'], it['ls']; break
    f = {'f': FAM.get(fam, fam), 's': float(size), 'w': int(weight), 'c': COLORS.get(color, color)}
    if lh and lh != 'normal': f['lh'] = round(float(lh[:-2]) / float(size), 3)
    else: f['lh'] = {'inter': 1.2, 'bs': 1.4, 'geist': 1.2}.get(f['f'], 1.7)  # Framer preset defaults
    if ls and ls != 'normal' and ls != '0px': f['ls'] = ls
    if align in ('center', 'right'): f['align'] = align
    return f

def convert(route):
    d = content[route]
    domf = f'{S}/ref/{DOMDIR[route]}/desktop-dom.json'
    dom = json.load(open(domf))['items'] if os.path.exists(domf) else []
    atoms = []
    for a in d['atoms']:
        if a['op'] == 0 or a['x'] < -50 or a['x'] > 1440: continue
        if a['tag'] in ('UL', 'OL') and not re.sub(r'[-\s]', '', a.get('text', '')): continue
        src = a.get('src') or ''
        if a['tag'] == 'IMG' and 'arrow=' in src: continue
        b = {'x': a['x'], 'y': a['y'], 'w': a['w'], 'h': a['h']}
        # Clipped (invisible but still taking space) in the original: 'Project Breakdown' overflow lines.
        if a.get('text') in ('Ongoing Project', 'AGLS Locomotion System is used', 'in this project'): b['hidden'] = True
        if 'text' in a:
            b.update(kind='text', tag=a['tag'].lower(), text=re.sub('\u2028+', '\n', a['text']), font=font_of(a, dom))
            if a.get('href') and not a['text'].startswith('['): b['href'] = a['href']
        elif a['tag'] == 'IMG' and 'ytimg.com' in src:
            b.update(kind='youtube', id=re.search(r'/vi(?:_webp)?/([^/]+)/', src).group(1))
        elif a['tag'] == 'IMG':
            b.update(kind='image', media=media_id(src), radius=a.get('radius', '0px'), fit=a.get('fit', 'cover'))
            if a.get('href'): b['href'] = a['href']
        elif a['tag'] == 'VIDEO':
            b.update(kind='video', media=media_id(src), radius=a.get('radius', '0px'), autoplay='autoplay' in a['attrs'] or 'muted' in a['attrs'])
        elif a['tag'] == 'IFRAME':
            b.update(kind='iframe', src=src)
        atoms.append(b)
    # Pier Extract slideshow (Framer Slideshow component): 7 unique slides in an 865x522 frame.
    for s in boxes.get(route, {}).get('slides', []):
        if s['imgs'] and route == '/pier-extract':
            atoms.append({'kind': 'slideshow', 'x': 288, 'y': 2151, 'w': 865, 'h': 522, 'media': [media_id(u) for u in s['imgs']]})
    for y in lines.get(route, []):
        atoms.append({'kind': 'rule', 'x': 256, 'y': y, 'w': 928, 'h': 1})
    atoms.sort(key=lambda a: (a['y'], a['x']))
    # cluster into rows by vertical overlap (rules always own row)
    rows = []
    for a in atoms:
        top, bot = a['y'], a['y'] + a['h']
        if rows and a['kind'] != 'rule' and rows[-1]['kind'] != 'rule' and top < rows[-1]['bottom'] - 4:
            r = rows[-1]; r['atoms'].append(a); r['bottom'] = max(r['bottom'], bot)
        else:
            rows.append({'kind': 'rule' if a['kind'] == 'rule' else 'row', 'top': top, 'bottom': bot, 'atoms': [a]})
    out = []
    prev_bottom = 0
    for r in rows:
        gap = r['top'] - prev_bottom
        prev_bottom = r['bottom']
        if r['kind'] == 'rule':
            out.append({'type': 'rule', 'mt': gap}); continue
        # columns by horizontal overlap
        cols = []
        for a in sorted(r['atoms'], key=lambda a: a['x']):
            for c in cols:
                if a['x'] < c['right'] - 2 and a['x'] + a['w'] > c['left'] + 2:
                    c['atoms'].append(a); c['left'] = min(c['left'], a['x']); c['right'] = max(c['right'], a['x'] + a['w']); break
            else:
                cols.append({'left': a['x'], 'right': a['x'] + a['w'], 'atoms': [a]})
        # merge columns that overlap after growth
        cols.sort(key=lambda c: c['left'])
        ocols = []
        for c in cols:
            items = []
            py = r['top']
            for a in sorted(c['atoms'], key=lambda a: a['y']):
                it = {k: v for k, v in a.items() if k not in ('x', 'y')}
                it['mt'] = a['y'] - py
                it['dx'] = a['x'] - c['left']
                py = a['y'] + a['h']
                items.append(it)
            ocols.append({'x': c['left'] - 256, 'w': c['right'] - c['left'], 'items': items})
        out.append({'type': 'row', 'mt': gap, 'h': r['bottom'] - r['top'], 'cols': ocols})
    out[0]['mt'] -= 120  # sticky sub-nav occupies 0..120 in flow
    return {'height': d['height'], 'pb': d['height'] - prev_bottom, 'blocks': out}

for route, slug in PAGES.items():
    data = convert(route)
    json.dump(data, open(f'{REPO}/src/data/case-studies/{slug}.json', 'w'), indent=1, ensure_ascii=False)
    print(slug, len(data['blocks']), 'blocks')
