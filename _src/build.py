#!/usr/bin/env python3
"""
בונה את עמודי האתר מתוך הרכיבים והתוכן, בכל השפות.

    python3 _src/build.py

מה הוא עושה:
  1. קורא את פרטי החברה, התפריט וכרטיסי ההמשך מ-_src/site.json.
  2. עובר על כל קובץ ב-_src/pages. בראש כל קובץ יש הערה עם הגדרות העמוד
     (כותרת, תיאור, כותרת עליונה וכו'), ואחריה התוכן של העמוד.
  3. מרכיב כל עמוד מהרכיבים שב-_src/components:
        head  ->  header  ->  [page-hero]  ->  תוכן  ->  [explore]  ->  footer
        ->  cookie-banner  ->  accessibility-menu  ->  סקריפטים
  4. כותב את העמודים בעברית לתיקייה הראשית (index.html, about.html ...),
     ואת התרגומים לתיקיות en/, fr/, de/, es/ (אותם שמות קבצים).
  5. מעדכן את sitemap.xml ואת קבצי התרגום של הסקריפטים (assets/js/i18n).

תרגום:
  העברית היא המקור. כל טקסט בעברית בעמודים וברכיבים מתורגם לפי המילונים
  ב-_src/i18n/<שפה>.json (מפתח = הטקסט בעברית, ערך = התרגום).
  אם משנים או מוסיפים טקסט בעברית, צריך להוסיף את התרגום שלו לכל מילון;
  הבנייה מתריעה על כל טקסט שאין לו תרגום.

תחביר בתוך הרכיבים והעמודים:
  {{phone}}      ערך מ-site.json (company) או מהגדרות העמוד
  {{> logo}}     הכללה של רכיב אחר מ-_src/components
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # תיקיית האתר
SRC = os.path.join(ROOT, '_src')
sys.path.insert(0, os.path.join(SRC, 'i18n'))
from segs import segments  # noqa: E402  (finds the Hebrew texts in a source file)

SITE = json.load(open(os.path.join(SRC, 'site.json'), encoding='utf-8'))
CO_HE = SITE['company']

# ---- languages: code -> (folder, direction, native name, short label) ----
LANGS = {
    'he': ('', 'rtl', 'עברית', 'עב'),
    'en': ('en/', 'ltr', 'English', 'EN'),
    'fr': ('fr/', 'ltr', 'Français', 'FR'),
    'de': ('de/', 'ltr', 'Deutsch', 'DE'),
    'es': ('es/', 'ltr', 'Español', 'ES'),
}
DICT = {'he': {}}
for code in LANGS:
    if code != 'he':
        DICT[code] = json.load(open(os.path.join(SRC, 'i18n', code + '.json'), encoding='utf-8'))

# Hebrew strings used inside the JavaScript files (translated into assets/js/i18n/<lang>.js)
JS_STRINGS = [
    'רגיל', 'גדול', 'גדול מאוד', 'יש למלא את השדה הזה', 'כתובת המייל לא נראית תקינה', 'יש לבחור נושא',
    'יש להשלים את השדות המסומנים.', 'זו תצוגה מקדימה, ולכן הפנייה לא נשלחה. באתר עצמו היא תגיע אל',
    'פנייה מהאתר', 'שולחים...', 'תודה! הפנייה נשלחה, ונחזור אליכם בהקדם.',
    'השליחה לא הצליחה. אפשר לנסות שוב, או לכתוב לנו ישירות ל-', 'סגירת התפריט', 'פתיחת התפריט', 'בקרוב',
    'מדינות · פרויקטים ומסחר', 'יבשות', 'מסחר פיזי במתכות מאז 2022',
]

# CDN scripts used by the home page (exact versions, loaded before our own home scripts)
CDN = {
    'gsap': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
    'three': 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
}

# Shared scripts on every page, in load order (all deferred)
SITE_SCRIPTS = [
    'assets/js/config.js',
    'assets/js/site/core.js',
    'assets/js/site/social-links.js',
    'assets/js/site/menu.js',
    'assets/js/site/reveal.js',
    'assets/js/site/cookie-consent.js',
    'assets/js/site/accessibility.js',
    'assets/js/site/cursor.js',
    'assets/js/site/way-cards.js',
    'assets/js/site/page-transitions.js',
    'assets/js/site/field-videos.js',
    'assets/js/site/brand-wall.js',
    'assets/js/site/contact-form.js',
]

LANG = 'he'          # the language being built right now
MISSING = set()      # Hebrew texts without a translation (reported at the end)


# ------------------------------------------------------------------
# Translation
# ------------------------------------------------------------------
def norm(text):
    return re.sub(r'\s+', ' ', text).strip()


def T(text):
    """Translate one Hebrew text into the current language."""
    if LANG == 'he':
        return text
    tr = DICT[LANG].get(norm(text))
    if tr is None:
        MISSING.add(norm(text))
        return text
    return tr


def translate_source(text, settings=True):
    """Replace every Hebrew text in a page or component source with its translation."""
    if LANG == 'he':
        return text
    out = text
    for _, start, end, seg in sorted(segments(text, settings), key=lambda s: -s[1]):
        out = out[:start] + T(seg) + out[end:]
    return out


def company():
    """Company details in the current language (address and dates are translated)."""
    co = dict(CO_HE)
    if LANG != 'he':
        for k in ('address', 'street', 'city', 'updated'):
            co[k] = T(co[k])
        co['name'] = co['name_en']
    return co


# ------------------------------------------------------------------
# Templates
# ------------------------------------------------------------------
def component(name, strip_comment=False):
    text = open(os.path.join(SRC, 'components', name + '.html'), encoding='utf-8').read()
    if strip_comment:  # inline includes (like the logo) don't need their explanation comment
        text = re.sub(r'^\s*<!--.*?-->\s*', '', text, flags=re.S).strip()
    return translate_source(text, settings=False)


def render(text, values):
    """Fill {{> component}} includes and {{key}} values."""
    text = re.sub(r'\{\{>\s*([\w-]+)\s*\}\}', lambda m: component(m.group(1), strip_comment=True), text)
    co = company()

    def value(m):
        key = m.group(1)
        if key in values:
            return values[key]
        if key in co:
            return co[key]
        raise KeyError('unknown placeholder {{%s}}' % key)
    return re.sub(r'\{\{\s*([\w-]+)\s*\}\}', value, text)


def read_page(path):
    """Split a page source (translated) into its settings (the first comment) and its content."""
    text = translate_source(open(path, encoding='utf-8').read(), settings=True)
    m = re.match(r'\s*<!--(.*?)-->\s*', text, re.S)
    settings = {}
    for line in m.group(1).strip().splitlines():
        key, _, val = line.partition(':')
        settings[key.strip()] = val.strip()
    return settings, text[m.end():]


# ------------------------------------------------------------------
# Building blocks
# ------------------------------------------------------------------
def current(href, page):
    """aria-current for the link of the page we are on (not for #section links)."""
    return ' aria-current="page"' if href == page else ''


def menus(page):
    desktop, mobile = [], []
    for i, item in enumerate(SITE['menu']):
        label = T(item['label'])
        if 'items' in item:
            links = ''.join('<a href="%s"%s><b>%s</b><small>%s</small></a>' % (h, current(h, page), T(t), T(s))
                            for h, t, s in item['items'])
            on = any(h.split('#')[0] == page for h, _, _ in item['items'])
            desktop.append(
                '<li class="has-sub"><button type="button" class="nl sub-t%s" aria-expanded="false" aria-controls="sm%d">'
                '%s <i class="chev" aria-hidden="true"></i></button><div class="sub" id="sm%d">%s</div></li>'
                % (' on" aria-current="true' if on else '', i, label, i, links))
            mobile.append('<h2>%s</h2>' % label +
                          ''.join('<a href="%s"%s>%s</a>' % (h, current(h, page), T(t)) for h, t, _ in item['items']))
        else:
            # the item is also marked active on its sub-pages (for example "what we do" on the food page)
            cur = current(item['href'], page) or (' aria-current="true"' if page in item.get('also', []) else '')
            desktop.append('<li><a class="nl" href="%s"%s>%s</a></li>' % (item['href'], cur, label))
            mobile.append('<a href="%s"%s>%s</a>' % (item['href'], cur, label))
    mobile.append('<a href="contact.html"%s>%s</a>' % (current('contact.html', page), T('צור קשר')))
    return ''.join(desktop), ''.join(mobile)


def lang_href(code, page):
    """Link from the current language's page to the same page in another language."""
    here = LANGS[LANG][0]
    return ('../' if here else '') + LANGS[code][0] + page


def lang_switch(page):
    """Language menu (desktop dropdown in the header) and the language row of the mobile menu."""
    items = ''.join(
        '<li><a href="%s" hreflang="%s" lang="%s"%s>%s</a></li>'
        % (lang_href(c, page), c, c, ' aria-current="true"' if c == LANG else '', LANGS[c][2])
        for c in LANGS)
    globe = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
             '<path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>')
    desktop = ('<div class="lang"><button type="button" class="nl lang-t" aria-expanded="false" aria-controls="langm" '
               'aria-label="Language / שפה: %s">%s<span>%s</span></button><ul class="lang-m" id="langm">%s</ul></div>'
               % (LANGS[LANG][2], globe, LANGS[LANG][3], items))
    mobile = '<ul class="mlang" aria-label="Language / שפה">%s</ul>' % items
    return desktop, mobile


def page_hero(s):
    crumbs = '<li><a href="index.html">%s</a></li>' % T('בית')
    for pair in filter(None, s.get('hero-crumbs', '').split(';')):
        href, _, label = pair.partition('=')
        crumbs += '<li><a href="%s">%s</a></li>' % (href.strip(), label.strip())
    crumbs += '<li aria-current="page">%s</li>' % re.sub('<[^>]+>', '', s['hero-eyebrow'])
    image = s.get('hero-image')
    css_class = ('' if image else ' noimg') + (' ' + s['hero-style'] if s.get('hero-style') else '')
    return render(component('page-hero'), {
        'hero_class': css_class,
        'crumbs': crumbs,
        'eyebrow': s['hero-eyebrow'],
        'hero_title': s['hero-title'],
        'lead': '<p class="lead">%s</p>' % s['hero-lead'] if s.get('hero-lead') else '',
        'figure': '<figure><img src="%s" alt="%s"></figure>' % (image, s.get('hero-image-alt', '')) if image else '',
    })


def explore(setting):
    if setting == 'none':
        return ''
    # "without a.html b.html" = כל הכרטיסים חוץ מהעמודים האלה
    skip = setting.replace('without', '').split() if setting.startswith('without') else []
    cards = [c for c in SITE['explore'] if c[0] not in skip]
    html = ''.join('<a class="xcard reveal" href="%s"><div><b>%s</b><span>%s</span><em>%s</em></div></a>'
                   % (c[0], T(c[1]), T(c[2]), T(c[3])) for c in cards)
    grid = ' data-count="%d"' % len(cards)   # CSS מתאים את מספר העמודות
    return render(component('explore'), {'cards': html, 'grid': grid})


def legal(content):
    toc = ''.join('<li><a href="#%s">%s</a></li>' % m for m in re.findall(r'<h2 id="([\w-]+)">(.*?)</h2>', content))
    return render(component('legal-layout'), {'toc': toc, 'content': content.strip()})


def organization_jsonld():
    data = {
        "@context": "https://schema.org", "@type": "Organization",
        "name": CO_HE['name'], "alternateName": CO_HE['name_en'], "url": CO_HE['domain'],
        "logo": CO_HE['domain'] + "/assets/img/favicon.svg",
        "email": CO_HE['email'], "telephone": CO_HE['tel'], "taxID": CO_HE['hp'],
        "address": {"@type": "PostalAddress", "streetAddress": CO_HE['street'], "addressLocality": CO_HE['city'], "addressCountry": "IL"},
    }
    return '<script type="application/ld+json">%s</script>\n' % json.dumps(data, ensure_ascii=False)


def page_url(code, page):
    return CO_HE['domain'] + '/' + LANGS[code][0] + ('' if page == 'index.html' else page)


def hreflang(page):
    """Tell search engines about the same page in the other languages."""
    links = ''.join('<link rel="alternate" hreflang="%s" href="%s">\n' % (c, page_url(c, page)) for c in LANGS)
    return links + '<link rel="alternate" hreflang="x-default" href="%s">\n' % page_url('he', page)


def styles():
    files = sorted(f for f in os.listdir(os.path.join(ROOT, 'assets', 'css')) if f.endswith('.css'))
    return '\n'.join('<link rel="stylesheet" href="assets/css/%s">' % f for f in files)


def ltr_fixes(html):
    """Arrows that point "forward" in Hebrew (right-to-left) are flipped for left-to-right languages."""
    return html.replace('←', '→').replace('↖', '↗')


def in_folder(html):
    """Pages inside en/, fr/ ... reach the shared assets one folder up."""
    return re.sub(r'(["\'(\s])assets/', r'\1../assets/', html)


# ------------------------------------------------------------------
# Page
# ------------------------------------------------------------------
def build(filename):
    s, content = read_page(os.path.join(SRC, 'pages', filename))
    layout = s.get('layout', 'page')
    folder, direction = LANGS[LANG][0], LANGS[LANG][1]
    desktop_menu, mobile_menu = menus(filename)
    lang_desktop, lang_mobile = lang_switch(filename)
    head_extra = hreflang(filename)
    if LANG != 'he':
        head_extra += '<script src="assets/js/i18n/%s.js"></script>\n' % LANG
    if layout == 'home':
        head_extra += organization_jsonld()
    values = dict(title=s['title'], description=s['description'], url=page_url(LANG, filename), styles=styles(),
                  head_extra=head_extra, lang=LANG, dir=direction, og_locale={'he': 'he_IL', 'en': 'en_US', 'fr': 'fr_FR', 'de': 'de_DE', 'es': 'es_ES'}[LANG],
                  menu=desktop_menu, mobile_menu=mobile_menu, lang_switch=lang_desktop, lang_mobile=lang_mobile,
                  contact_current=current('contact.html', filename))

    body = render(content, values).strip('\n')
    if layout == 'legal':
        body = legal(body)
    if 'hero-title' in s:
        body = page_hero(s) + '\n' + body

    out = [render(component('head'), values)]
    if layout == 'home':
        out.append('<body class="locked" data-home>\n')
        out.append(component('home-loader'))
    else:
        out.append('<body>\n')
    out.append(render(component('header'), values))
    if layout == 'home':
        out.append('<canvas id="gl" aria-hidden="true"></canvas>\n')  # three.js carton draws here
    out.append('\n<main id="main" tabindex="-1">\n%s\n%s</main>\n\n' % (body, explore(s.get('explore', 'all'))))
    out.append(render(component('footer'), values) + '\n')
    out.append(component('cookie-banner') + '\n')
    out.append(component('accessibility-menu') + '\n')

    # home page scripts first (in order, not deferred), then the shared site scripts
    if s.get('scripts'):
        out.append('<!-- סקריפטים של דף הבית -->\n')
        for src in [x.strip() for x in s['scripts'].split(',')]:
            out.append('<script src="%s"></script>\n' % CDN.get(src, src))
    out.append('<!-- סקריפטים משותפים לכל העמודים -->\n')
    out.extend('<script src="%s" defer></script>\n' % src for src in SITE_SCRIPTS)
    out.append('</body>\n</html>\n')

    html = ''.join(out)
    leftover = re.findall(r'\{\{.*?\}\}', html)
    assert not leftover, (filename, leftover)
    if direction == 'ltr':
        html = ltr_fixes(html)
    if folder:
        html = in_folder(html)
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    open(os.path.join(ROOT, folder, filename), 'w', encoding='utf-8').write(html)
    return folder + filename


def js_dictionary():
    """assets/js/i18n/<lang>.js: the translations of the texts used inside the scripts."""
    os.makedirs(os.path.join(ROOT, 'assets', 'js', 'i18n'), exist_ok=True)
    data = {s: T(s) for s in JS_STRINGS}
    open(os.path.join(ROOT, 'assets', 'js', 'i18n', LANG + '.js'), 'w', encoding='utf-8').write(
        '/* נוצר אוטומטית על ידי _src/build.py: תרגום הטקסטים שבתוך הסקריפטים (%s). לא לערוך ידנית. */\n'
        'window.EY_DICT = %s;\n' % (LANGS[LANG][2], json.dumps(data, ensure_ascii=False, indent=1)))


def sitemap(pages):
    pages = [p for p in pages if not p.endswith('404.html')]
    xml = ''.join('  <url><loc>%s/%s</loc><lastmod>%s</lastmod></url>\n'
                  % (CO_HE['domain'], re.sub(r'(^|/)index\.html$', r'\1', p), CO_HE['updated_iso']) for p in pages)
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + xml + '</urlset>\n')


if __name__ == '__main__':
    built = []
    sources = sorted(f for f in os.listdir(os.path.join(SRC, 'pages')) if f.endswith('.html'))
    for LANG in LANGS:
        built += [build(f) for f in sources]
        if LANG != 'he':
            js_dictionary()
    sitemap(built)
    print('built %d pages in %d languages' % (len(built), len(LANGS)))
    if MISSING:
        print('\nMISSING TRANSLATIONS (%d): add them to _src/i18n/*.json' % len(MISSING))
        for m in sorted(MISSING):
            print('  -', m[:120])
        sys.exit(1)
