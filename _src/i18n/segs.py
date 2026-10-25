"""Extract translatable Hebrew segments (text nodes, some attributes, settings values) from a source file."""
import re
HEB=re.compile(r'[֐-׿]')
ATTRS=('alt','aria-label','placeholder','title','content')
def segments(src, settings=True):
    """Return list of (kind, start, end, text) in document order."""
    out=[]
    # settings comment (pages): values with Hebrew
    m=re.match(r'\s*<!--(.*?)-->',src,re.S)
    if settings and m and ':' in m.group(1):
        base=m.start(1)
        for lm in re.finditer(r'^\s*([\w-]+):\s*(.*?)\s*$',m.group(1),re.M):
            if HEB.search(lm.group(2)): out.append(('set:'+lm.group(1),base+lm.start(2),base+lm.end(2),lm.group(2)))
        skip_until=m.end()
    else: skip_until=0
    # strip comments, scripts, svgs from consideration
    masked=list(src)
    for mm in re.finditer(r'<!--.*?-->|<svg.*?</svg>|<script.*?</script>|<style.*?</style>',src,re.S):
        for i in range(mm.start(),mm.end()): masked[i]='\0'
    for i in range(skip_until): masked[i]='\0'
    ms=''.join(masked)
    # tags: attributes
    for tm in re.finditer(r'<[a-zA-Z][^>]*>',ms):
        for am in re.finditer(r'\s(%s)="([^"]*)"'%'|'.join(ATTRS),tm.group(0)):
            if HEB.search(am.group(2)):
                s=tm.start()+am.start(2);out.append(('attr:'+am.group(1),s,s+len(am.group(2)),am.group(2)))
    # text nodes
    for xm in re.finditer(r'>([^<>\0]+)<',ms):
        t=xm.group(1)
        if HEB.search(t):
            # trim whitespace
            l=len(t)-len(t.lstrip());r=len(t.rstrip())
            out.append(('text',xm.start(1)+l,xm.start(1)+r,t[l:r]))
    out.sort(key=lambda o:o[1])
    return out
def apply(src,segs,trans):
    assert len(segs)==len(trans),(len(segs),len(trans))
    res=src
    for (k,s,e,t),tr in sorted(zip(segs,trans),key=lambda z:-z[0][1]):
        res=res[:s]+tr+res[e:]
    return res
