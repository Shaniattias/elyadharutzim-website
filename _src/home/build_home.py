"""העמודים בעיצוב הכחול: דף הבית (index.html) ומסחר בסחורות (commodities.html), בחמש שפות.

המקור: _src/home/template.html ו-_src/home/commodities.html (עברית), _src/home/tr.json (תרגומים).
העיצוב המשותף: assets/home/ey.css.
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
# (קובץ התבנית, שם העמוד שנבנה)
PAGES = [('template.html', 'index.html'), ('commodities.html', 'commodities.html')]
HEB = re.compile(r'[֐-׿]')


def page_path(code, name='index.html'):
    return name if code == 'he' else code + '/' + name


def url(code, name='index.html'):
    tail = '' if name == 'index.html' else name
    return DOMAIN + '/' + tail if code == 'he' else '%s/%s/%s' % (DOMAIN, code, tail)


def fix_paths(s, up):
    """נתיבי התמונות, הסרטונים והגופנים של התבנית -> הנתיבים באתר."""
    def img(m):
        name = m.group(2)
        folder = 'assets/img/' if (name == 'favicon.svg' or '/' in name) else (
            'assets/img/team/' if name in TEAM else 'assets/img/field/')
        return m.group(1) + up + folder + name
    s = re.sub(r'((?:src|href|poster)="|url\()img/([^")]+)', img, s)
    s = re.sub(r'((?:src)=")video/', r'\1' + up + 'assets/video/', s)
    s = s.replace('url(fonts/', 'url(' + up + 'assets/fonts/')
    s = s.replace('href="home/', 'href="' + up + 'assets/home/')
    return s


def build():
    tr = json.load(open(os.path.join(HERE, 'tr.json'), encoding='utf-8'))
    site = {c: json.load(open(os.path.join(ROOT, '_src', 'i18n', c + '.json'), encoding='utf-8'))
            for c, _, _ in LANGS if c != 'he'}
    missing = []
    for tname, page in PAGES:
      tpl = open(os.path.join(HERE, tname), encoding='utf-8').read()
      for code, name, short in LANGS:
          up = '' if code == 'he' else '../'
          s = tpl
          # קישורים לעמודים האחרים באתר: יחסיים, כך שכל שפה מקבלת את העמוד בשפה שלה
          # (לפני הוספת הכתובות המלאות לגוגל, שצריכות להישאר מלאות)
          s = s.replace('https://elyadharutzim.com/', '')

          def rel(target):  # קישור מהעמוד הנוכחי לעמוד הבית בשפה אחרת
              return up + page_path(target, page)

          word = 'שפה' if code == 'he' else tr['שפה'][code]
          items = ''.join('<li><a href="%s" lang="%s" hreflang="%s"%s>%s</a></li>'
                          % (rel(c), c, c, ' aria-current="true"' if c == code else '', n) for c, n, _ in LANGS)
          s = s.replace('{{LANG}}', '<div class="lang"><button type="button" class="langb" id="langb" aria-expanded="false" '
                        'aria-controls="langm" aria-label="%s: %s">%s<span>%s</span></button><ul class="langm" id="langm" hidden>%s</ul></div>'
                        % (word, name, GLOBE, short, items))
          s = s.replace('{{MLANG}}', '<ul class="mlang" aria-label="%s">%s</ul>' % (word, items))

          # לגוגל: בלי noindex, עם כתובת קנונית וקישורים לשפות האחרות
          s = s.replace('<meta name="robots" content="noindex">\n', '')
          head = ('<link rel="canonical" href="%s">\n' % url(code, page) +
                  ''.join('<link rel="alternate" hreflang="%s" href="%s">\n' % (c, url(c, page)) for c, _, _ in LANGS) +
                  '<link rel="alternate" hreflang="x-default" href="%s">\n' % url('he', page) +
                  '<meta property="og:type" content="website">\n<meta property="og:url" content="%s">\n' % url(code, page) +
                  '<meta property="og:image" content="%s/assets/img/field/team-walk-plant.webp">\n' % DOMAIN +
                  '<meta name="twitter:card" content="summary_large_image">\n')
          s = s.replace('<link rel="icon"', head + '<link rel="icon"')

          s = fix_paths(s, up)
          # קישורים בין העמודים הכחולים: לחלקים בדף הבית, וסימון העמוד הנוכחי בתפריט
          s = s.replace('{{HOME}}', '' if page == 'index.html' else 'index.html')
          s = s.replace('{{CUR_COM}}', ' aria-current="page"' if page == 'commodities.html' else '')

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
          out = os.path.join(ROOT, page_path(code, page))
          os.makedirs(os.path.dirname(out), exist_ok=True)
          open(out, 'w', encoding='utf-8').write(s)
    add_to_sitemap()
    return missing


def add_to_sitemap():
    """build.py כותב את sitemap.xml מהעמודים שלו. כאן מוסיפים את העמודים הכחולים שאינם שם."""
    path = os.path.join(ROOT, 'sitemap.xml')
    if not os.path.exists(path):
        return
    xml = open(path, encoding='utf-8').read()
    m = re.search(r'<lastmod>([^<]+)</lastmod>', xml)
    day = m.group(1) if m else ''
    add = ''
    for _, page in PAGES:
        for code, _, _ in LANGS:
            loc = url(code, page)
            if '<loc>%s</loc>' % loc not in xml:
                add += '  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n' % (loc, day)
    if add:
        open(path, 'w', encoding='utf-8').write(xml.replace('</urlset>', add + '</urlset>'))


if __name__ == '__main__':
    m = build()
    print('home page built in %d languages' % len(LANGS))
    for x in m:
        print('  MISSING:', x)
