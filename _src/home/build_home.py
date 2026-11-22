"""דף הבית (העיצוב הכחול): בונה את index.html בעברית ואת en/ fr/ de/ es/index.html.

המקור: _src/home/template.html (עברית) ו-_src/home/tr.json (תרגומים).
תרגומים שלא נמצאים ב-tr.json נלקחים מ-_src/i18n/<lang>.json.
מופעל אוטומטית בסוף _src/build.py. אפשר גם להריץ לבד:  python3 _src/home/build_home.py
"""
import json, os, re, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DOMAIN = 'https://elyadharutzim.com'
LANGS = [('he', 'עברית', 'עב'), ('en', 'English', 'EN'), ('fr', 'Français', 'FR'),
         ('de', 'Deutsch', 'DE'), ('es', 'Español', 'ES')]
GLOBE = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 '
         '3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>')
TEAM = ('shaul-akav.jpg', 'netanel-barak.jpg', 'shlomo-ben-david.jpg')
HEB = re.compile(r'[֐-׿]')


def page_path(code):
    return 'index.html' if code == 'he' else code + '/index.html'


def url(code):
    return DOMAIN + '/' if code == 'he' else '%s/%s/' % (DOMAIN, code)


def fix_paths(s, up):
    """נתיבי התמונות, הסרטונים והגופנים של התבנית -> הנתיבים באתר."""
    def img(m):
        name = m.group(2)
        folder = 'assets/img/' if name == 'favicon.svg' else (
            'assets/img/team/' if name in TEAM else 'assets/img/field/')
        return m.group(1) + up + folder + name
    s = re.sub(r'((?:src|href|poster)="|url\()img/([^")]+)', img, s)
    s = re.sub(r'((?:src)=")video/', r'\1' + up + 'assets/video/', s)
    s = s.replace('url(fonts/', 'url(' + up + 'assets/fonts/')
    return s


def build():
    tpl = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
    tr = json.load(open(os.path.join(HERE, 'tr.json'), encoding='utf-8'))
    site = {c: json.load(open(os.path.join(ROOT, '_src', 'i18n', c + '.json'), encoding='utf-8'))
            for c, _, _ in LANGS if c != 'he'}
    missing = []
    for code, name, short in LANGS:
        up = '' if code == 'he' else '../'
        s = tpl

        def rel(target):  # קישור מהעמוד הנוכחי לעמוד הבית בשפה אחרת
            return up + page_path(target)

        word = 'שפה' if code == 'he' else tr['שפה'][code]
        items = ''.join('<li><a href="%s" lang="%s" hreflang="%s"%s>%s</a></li>'
                        % (rel(c), c, c, ' aria-current="true"' if c == code else '', n) for c, n, _ in LANGS)
        s = s.replace('{{LANG}}', '<div class="lang"><button type="button" class="langb" id="langb" aria-expanded="false" '
                      'aria-controls="langm" aria-label="%s: %s">%s<span>%s</span></button><ul class="langm" id="langm" hidden>%s</ul></div>'
                      % (word, name, GLOBE, short, items))
        s = s.replace('{{MLANG}}', '<ul class="mlang" aria-label="%s">%s</ul>' % (word, items))

        # לגוגל: בלי noindex, עם כתובת קנונית וקישורים לשפות האחרות
        s = s.replace('<meta name="robots" content="noindex">\n', '')
        head = ('<link rel="canonical" href="%s">\n' % url(code) +
                ''.join('<link rel="alternate" hreflang="%s" href="%s">\n' % (c, url(c)) for c, _, _ in LANGS) +
                '<link rel="alternate" hreflang="x-default" href="%s/">\n' % DOMAIN +
                '<meta property="og:type" content="website">\n<meta property="og:url" content="%s">\n' % url(code) +
                '<meta property="og:image" content="%s/assets/img/field/team-walk-plant.webp">\n' % DOMAIN +
                '<meta name="twitter:card" content="summary_large_image">\n')
        s = s.replace('<link rel="icon"', head + '<link rel="icon"')

        # קישורים לעמודים האחרים באתר: יחסיים, כך שכל שפה מקבלת את העמוד בשפה שלה
        s = s.replace('https://elyadharutzim.com/', '')
        s = fix_paths(s, up)

        if code != 'he':
            s = s.replace('<html lang="he" dir="rtl">', '<html lang="%s" dir="ltr">' % code)
            s = s.replace('<span class="ar" aria-hidden="true">←</span>', '<span class="ar" aria-hidden="true">→</span>')
            s = s.replace('aria-label="הקודם">→</button>', 'aria-label="הקודם">←</button>')
            s = s.replace('aria-label="הבא">←</button>', 'aria-label="הבא">→</button>')
            keys = sorted(set(tr) | set(site[code]), key=len, reverse=True)
            for k in keys:
                if not HEB.search(k) or k in ('שפה', 'עברית'):
                    continue
                v = tr[k][code] if k in tr else site[code][k]
                s = re.sub(r'(>\s*)' + re.escape(k) + r'(\s*<)',
                           lambda m: m.group(1) + html.escape(v, quote=False) + m.group(2), s)
                s = s.replace('="%s"' % k, '="%s"' % html.escape(v, quote=True))
                s = s.replace("'%s'" % k, "'" + v.replace("'", "\\'") + "'")
            chk = re.sub(r'<!--.*?-->', '', s, flags=re.S)
            chk = re.sub(r'//[^\n]*', '', chk).replace('עברית', '')
            missing += ['%s: %s' % (code, x.strip()) for x in
                        sorted(set(re.findall(r'[^<>"\']*[֐-׿][^<>"\']*', chk)))]
        out = os.path.join(ROOT, page_path(code))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(s)
    return missing


if __name__ == '__main__':
    m = build()
    print('home page built in %d languages' % len(LANGS))
    for x in m:
        print('  MISSING:', x)
