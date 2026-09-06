import json, re, html
from pathlib import Path
from collections import defaultdict
from urllib.parse import quote
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent
BASE='https://nearbymassage.app/'
LISTINGS=json.load(open(ROOT/'listings.json',encoding='utf-8'))

def esc(x): return html.escape(str(x or ''), quote=True)
def phone_digits(x):
    d=re.sub(r'\D','',str(x or ''))
    return ('65'+d) if d and not d.startswith('65') else d

def slug_area_filename(area):
    return 'massage-'+re.sub(r'[^a-z0-9]+','-',area.lower()).strip('-')+'.html'

# Canonical directory areas that correspond directly to listing data.
AREA_FILE={
 'Yio Chu Kang':'massage-yio-chu-kang.html','Hougang':'massage-hougang.html','Chinatown':'massage-chinatown.html',
 'Farrer Park':'massage-farrer-park.html','Bukit Timah':'massage-bukit-timah.html','Bedok':'massage-bedok.html',
 'Tampines':'massage-tampines.html','Bukit Merah':'massage-bukit-merah.html','Orchard':'massage-orchard.html',
 'Kallang':'massage-kallang.html','Lavender':'massage-lavender.html','Katong':'massage-katong.html','Novena':'massage-novena.html',
 'Ang Mo Kio':'massage-ang-mo-kio.html','Ang Mo Kio / Yio Chu Kang':'massage-ang-mo-kio-yio-chu-kang.html',
 'Bishan-Ang Mo Kio Park':'massage-bishan-ang-mo-kio-park.html','Upper Thomson':'massage-upper-thomson.html',
 'Jalan Besar':'massage-jalan-besar.html','Clarke Quay':'massage-clarke-quay.html'
}
FILE_AREA={v:k for k,v in AREA_FILE.items()}

# Extra discovery pages already present in the project. These clearly disclose that results may be in nearby areas.
EXTRA={
 'massage-singapore.html':('Singapore', list(AREA_FILE.keys())),
 'massage-somerset.html':('Somerset',['Orchard']),
 'massage-dhoby-ghaut-orchard.html':('Dhoby Ghaut / Orchard',['Orchard']),
 'massage-siglap.html':('Siglap',['Katong','Bedok']),
 'massage-serangoon.html':('Serangoon',['Hougang']),
 'massage-tiong-bahru.html':('Tiong Bahru',['Bukit Merah']),
 'massage-bukit-batok.html':('Bukit Batok',['Bukit Timah']),
}

NEARBY={
 'Yio Chu Kang':['Ang Mo Kio','Ang Mo Kio / Yio Chu Kang','Hougang'],
 'Hougang':['Serangoon','Yio Chu Kang','Ang Mo Kio'],
 'Chinatown':['Clarke Quay','Tiong Bahru','Orchard'],
 'Farrer Park':['Jalan Besar','Lavender','Orchard'],
 'Bukit Timah':['Bukit Batok','Upper Thomson','Novena'],
 'Bedok':['Siglap','Katong','Tampines'],
 'Tampines':['Bedok','Siglap','Katong'],
 'Bukit Merah':['Tiong Bahru','Chinatown','Clarke Quay'],
 'Orchard':['Somerset','Dhoby Ghaut / Orchard','Novena','Clarke Quay'],
 'Kallang':['Lavender','Jalan Besar','Farrer Park'],
 'Lavender':['Kallang','Jalan Besar','Farrer Park'],
 'Katong':['Siglap','Bedok','Kallang'],
 'Novena':['Orchard','Upper Thomson','Bukit Timah'],
 'Ang Mo Kio':['Yio Chu Kang','Bishan-Ang Mo Kio Park','Upper Thomson','Hougang'],
 'Ang Mo Kio / Yio Chu Kang':['Ang Mo Kio','Yio Chu Kang','Bishan-Ang Mo Kio Park'],
 'Bishan-Ang Mo Kio Park':['Ang Mo Kio','Upper Thomson','Yio Chu Kang'],
 'Upper Thomson':['Bishan-Ang Mo Kio Park','Ang Mo Kio','Novena','Bukit Timah'],
 'Jalan Besar':['Farrer Park','Lavender','Kallang'],
 'Clarke Quay':['Chinatown','Orchard','Tiong Bahru'],
 'Somerset':['Orchard','Dhoby Ghaut / Orchard','Clarke Quay'],
 'Dhoby Ghaut / Orchard':['Orchard','Somerset','Clarke Quay'],
 'Siglap':['Katong','Bedok','Tampines'],
 'Serangoon':['Hougang','Ang Mo Kio','Yio Chu Kang'],
 'Tiong Bahru':['Bukit Merah','Chinatown','Clarke Quay'],
 'Bukit Batok':['Bukit Timah','Upper Thomson','Novena'],
 'Singapore':['Orchard','Chinatown','Ang Mo Kio','Hougang','Upper Thomson','Bedok'],
}

CONTEXT={
 'Yio Chu Kang':'Use this directory to compare massage and wellness listings around Yio Chu Kang and the surrounding north-east residential areas.',
 'Hougang':'Hougang has one of the larger groups of listings in this directory, making this page useful for comparing several nearby options before contacting a shop.',
 'Chinatown':'This page brings together directory listings around Chinatown so visitors can compare addresses, photos and direct contact options in one place.',
 'Farrer Park':'Browse massage and wellness businesses listed around Farrer Park, with direct links to each shop page for address, photos and contact details.',
 'Bukit Timah':'Browse the current NearByMassage listing for Bukit Timah and use the nearby-area links to widen your search when needed.',
 'Bedok':'Compare the businesses currently listed under Bedok, then open each business page for its available photos, contact information and directions.',
 'Tampines':'This page focuses on the current Tampines directory listing and links to nearby eastern areas when you want more choices.',
 'Bukit Merah':'Find businesses listed under Bukit Merah and continue to nearby central-area directory pages if you want to compare more options.',
 'Orchard':'Orchard has multiple listings in the directory. Compare businesses here, then use each dedicated shop page for the details available in the site data.',
 'Kallang':'Browse the current Kallang listing and nearby central-area pages, with direct access to shop details and map directions.',
 'Lavender':'Compare directory listings in Lavender and use the nearby links for Jalan Besar, Kallang and Farrer Park when broadening your search.',
 'Katong':'Browse the current Katong listing, then explore Siglap, Bedok and other nearby eastern areas for additional choices.',
 'Novena':'This page highlights the current Novena listing and links naturally to nearby Orchard, Upper Thomson and Bukit Timah directory pages.',
 'Ang Mo Kio':'Ang Mo Kio contains the largest group of listings in this directory, so this page is designed for fast comparison of many nearby businesses.',
 'Ang Mo Kio / Yio Chu Kang':'This combined directory area covers a listing categorized across Ang Mo Kio and Yio Chu Kang, with links to both individual area pages.',
 'Bishan-Ang Mo Kio Park':'Browse the current listing categorized around Bishan-Ang Mo Kio Park and compare additional choices in Ang Mo Kio and Upper Thomson.',
 'Upper Thomson':'Upper Thomson has a substantial group of directory listings. Use this page to compare businesses before opening their individual detail pages.',
 'Jalan Besar':'Browse the current Jalan Besar listing and quickly expand your search to Farrer Park, Lavender and Kallang through the nearby-area links.',
 'Clarke Quay':'Browse the current Clarke Quay listing and compare additional central-area choices through Chinatown, Orchard and Tiong Bahru pages.',
 'Somerset':'Somerset is represented here through listings categorized in nearby Orchard. The page clearly links to each business page rather than relabelling its stored area.',
 'Dhoby Ghaut / Orchard':'This discovery page uses businesses categorized under Orchard in the site data, giving visitors another useful route into the central shopping district listings.',
 'Siglap':'For Siglap searches, this page surfaces businesses categorized in nearby Katong and Bedok and clearly shows each business’s stored area and address.',
 'Serangoon':'For Serangoon searches, this page surfaces businesses categorized in nearby Hougang and clearly identifies their actual directory area.',
 'Tiong Bahru':'For Tiong Bahru searches, this page surfaces businesses categorized in nearby Bukit Merah and displays the actual area and address for each listing.',
 'Bukit Batok':'For Bukit Batok searches, this page currently surfaces the directory’s Bukit Timah listing as a nearby comparison option and labels it accordingly.',
 'Singapore':'Explore all approved massage and wellness listings in the NearByMassage directory, grouped through dedicated area and business pages across Singapore.'
}

# Reverse lookup for extra page names.
EXTRA_AREA_FILE={title:fname for fname,(title,_) in EXTRA.items()}
def area_href(name):
    if name in AREA_FILE: return AREA_FILE[name]
    return EXTRA_AREA_FILE.get(name)

def listings_for_file(fname):
    if fname in FILE_AREA:
        area=FILE_AREA[fname]
        return area,[x for x in LISTINGS if x.get('area')==area],False
    title, source_areas=EXTRA[fname]
    if title=='Singapore':
        return title,LISTINGS[:],True
    return title,[x for x in LISTINGS if x.get('area') in source_areas],True

def card(x, indirect=False):
    photo=(x.get('photos') or [''])[0]
    img=f'<img src="{esc(photo)}" alt="{esc(x["name"])}" loading="lazy" width="180" height="220">' if photo else '<div class="placeholder" aria-hidden="true">Nearby</div>'
    p=phone_digits(x.get('phone'))
    actions=[]
    if p:
        actions += [f'<a class="btn" href="tel:+{p}">Call</a>',f'<a class="btn" href="https://wa.me/{p}" rel="noopener" target="_blank">WhatsApp</a>']
    actions += [f'<a class="btn secondary" href="{esc(x["page"])}">View details</a>',f'<a class="textlink" href="https://www.google.com/maps/search/?api=1&query={quote(str(x.get("address") or x["name"]))}" rel="noopener" target="_blank">Directions</a>']
    area_note=f'<p class="area-note">Directory area: <strong>{esc(x.get("area"))}</strong></p>' if indirect else ''
    desc=(x.get('description') or '').strip()
    if desc: desc=f'<p>{esc(desc[:260])}</p>'
    return f'''<article class="shop-card">{img}<div><h2><a href="{esc(x['page'])}">{esc(x['name'])}</a></h2>{area_note}<p class="address">{esc(x.get('address'))}</p>{desc}<div class="actions">{' '.join(actions)}</div></div></article>'''

def make_schema(title,fname,shops):
    crumbs={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
      {'@type':'ListItem','position':1,'name':'NearByMassage','item':BASE},
      {'@type':'ListItem','position':2,'name':f'Massage in {title}','item':BASE+fname}
    ]}
    itemlist={'@context':'https://schema.org','@type':'ItemList','name':f'Massage and wellness listings for {title}',
      'itemListElement':[{'@type':'ListItem','position':i+1,'name':x['name'],'url':BASE+x['page']} for i,x in enumerate(shops)]}
    return json.dumps(crumbs,ensure_ascii=False,separators=(',',':')),json.dumps(itemlist,ensure_ascii=False,separators=(',',':'))

def render(fname):
    title,shops,indirect=listings_for_file(fname)
    shops=sorted(shops,key=lambda x:(x.get('area',''),x.get('name','').lower()))
    count=len(shops)
    if title=='Singapore':
        page_title='Massage in Singapore | Browse Nearby Shops | NearByMassage'
        meta=f'Browse {count} massage and wellness listings across Singapore. Compare areas, addresses, photos, contact options and directions on NearByMassage.'
        lead=f'Browse {count} massage and wellness listings currently included in the NearByMassage directory.'
    elif indirect:
        page_title=f'Massage near {title} | Nearby Listings | NearByMassage'
        meta=f'Browse massage and wellness listings near {title}, Singapore. View the actual directory area, address, business details and directions.'
        lead=f'This page shows {count} relevant director' + ('y listing' if count==1 else 'y listings') + f' for people searching around {title}.'
    else:
        page_title=f'Massage in {title} | Nearby Shops | NearByMassage'
        meta=f'Browse {count} massage and wellness listing' + (' in ' if count==1 else 's in ') + f'{title}, Singapore. Compare addresses, photos, contact options and directions.'
        lead=f'NearByMassage currently has {count} business' + (' listing' if count==1 else ' listings') + f' categorized under {title}.'
    context=CONTEXT.get(title,'Browse the directory listings for this part of Singapore and open individual business pages for available details.')
    near=[]
    for n in NEARBY.get(title,[]):
        href=area_href(n)
        if href: near.append(f'<a class="pill" href="{href}">{esc(n)}</a>')
    if title=='Singapore':
        near=[]
        # Show all canonical data areas as an index.
        for n in sorted(AREA_FILE): near.append(f'<a class="pill" href="{AREA_FILE[n]}">{esc(n)}</a>')
    disclosure=''
    if indirect and title!='Singapore':
        source=EXTRA[fname][1]
        disclosure=f'<div class="notice"><strong>Location note:</strong> the businesses below are stored in the directory under {esc(", ".join(source))}. Their actual area and address are shown on every card.</div>'
    cards=''.join(card(x, indirect and title!='Singapore') for x in shops)
    if not cards: cards='<div class="notice">There are no matching businesses in the current directory data for this page yet.</div>'
    b1,b2=make_schema(title,fname,shops)
    faq=[
      (f'How do I compare massage listings around {title}?','Use the business cards on this page to compare the stored area and address, then open a business page for the details, photos and contact options available in the directory.'),
      ('Can I contact a business directly from NearByMassage?','Where a phone number is available in the listing data, the directory provides direct Call and WhatsApp links.'),
      ('How can I see more choices nearby?','Use the nearby-area links on this page or return to the Singapore directory to browse businesses in other parts of the island.')
    ]
    faq_html=''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q,a in faq)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(page_title)}</title><meta name="description" content="{esc(meta)}">
<link rel="canonical" href="{BASE}{fname}">
<script type="application/ld+json">{b1}</script><script type="application/ld+json">{b2}</script>
<style>
*{{box-sizing:border-box}}body{{font-family:Arial,sans-serif;background:#f7f3ee;margin:0;color:#2a211b;line-height:1.55}}a{{color:#12683f}}header{{background:#2b1c13;color:#fff;padding:40px 18px 34px}}header .wrap,main,.footer-inner{{max-width:1100px;margin:auto}}header a{{color:#ffe7ad}}h1{{font-size:clamp(2rem,5vw,3.25rem);margin:.35rem 0}}header p{{max-width:760px;font-size:1.08rem}}.crumbs{{font-size:.92rem;margin-bottom:10px}}main{{padding:24px 16px 44px}}.intro,.section{{background:#fff;border-radius:14px;padding:20px;margin-bottom:20px;box-shadow:0 4px 16px rgba(60,35,20,.06)}}.intro p{{max-width:850px}}.notice{{border-left:4px solid #a57b45;background:#fff8e8;padding:12px 14px;margin:16px 0;border-radius:6px}}.shop-card{{display:grid;grid-template-columns:180px 1fr;gap:18px;background:#fff;border-radius:14px;padding:14px;margin:0 0 16px;box-shadow:0 4px 16px rgba(60,35,20,.08)}}.shop-card img,.placeholder{{width:180px;height:220px;object-fit:cover;object-position:top center;border-radius:10px;background:#eadfd2}}.placeholder{{display:grid;place-items:center;color:#735f50;font-weight:bold}}.shop-card h2{{margin:.2rem 0 .4rem;font-size:1.3rem}}.address,.area-note{{margin:.35rem 0}}.actions{{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}}.btn{{display:inline-block;background:#12683f;color:#fff;text-decoration:none;border-radius:7px;padding:8px 11px;font-weight:bold}}.btn.secondary{{background:#594136}}.textlink{{padding:8px 2px;font-weight:bold}}.pills{{display:flex;flex-wrap:wrap;gap:9px}}.pill{{display:inline-block;background:#f2e7d7;border-radius:999px;padding:8px 12px;text-decoration:none;font-weight:bold}}details{{border-top:1px solid #e7ddd3;padding:12px 0}}summary{{font-weight:bold;cursor:pointer}}footer{{background:#2b1c13;color:#f6efe8;padding:24px 16px}}footer a{{color:#ffe7ad}}@media(max-width:650px){{.shop-card{{grid-template-columns:1fr}}.shop-card img,.placeholder{{width:100%;height:auto;aspect-ratio:16/9}}}}
</style></head><body>
<header><div class="wrap"><nav class="crumbs"><a href="index.html">NearByMassage</a> › {esc(title)}</nav><h1>{'Massage in Singapore' if title=='Singapore' else 'Massage near '+esc(title) if indirect else 'Massage in '+esc(title)}</h1><p>{esc(lead)}</p></div></header>
<main>
<section class="intro"><h2>Browse {esc(title)} massage &amp; wellness listings</h2><p>{esc(context)}</p><p>NearByMassage is a directory: business information is presented from the current site listing data so you can compare options and contact a business directly. Always confirm current services, prices and opening hours with the business before visiting.</p>{disclosure}</section>
<section aria-labelledby="shops"><h2 id="shops">{'Directory listings' if title=='Singapore' else 'Listings around '+esc(title)}</h2>{cards}</section>
<section class="section"><h2>Explore nearby areas</h2><p>Broaden your search using these related directory pages.</p><div class="pills">{''.join(near)}</div></section>
<section class="section"><h2>How to use this directory page</h2><p>Start with the address and directory area shown for each business. Open <strong>View details</strong> for the dedicated business page, use <strong>Directions</strong> to open a map search, or contact the business directly when Call or WhatsApp is available. For more choices, use the nearby-area links above.</p></section>
<section class="section"><h2>Frequently asked questions</h2>{faq_html}</section>
</main><footer><div class="footer-inner"><a href="index.html">NearByMassage Singapore</a> · <a href="massage-singapore.html">Browse all areas</a><p>Directory information may change. Confirm details directly with each business.</p></div></footer>
</body></html>'''

# Regenerate all area/discovery pages present in Phase 2 that we know how to ground.
files=list(AREA_FILE.values())+list(EXTRA.keys())
for fname in files:
    (ROOT/fname).write_text(render(fname),encoding='utf-8')

# Sitemap: include homepage, all 86 listing pages and all Phase 3 area pages only once.
urls=['index.html']+[x['page'] for x in LISTINGS]+files
seen=[]
for u in urls:
    if u not in seen and (ROOT/u).exists(): seen.append(u)
ns='http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('',ns)
root=ET.Element('{%s}urlset'%ns)
for u in seen:
    node=ET.SubElement(root,'{%s}url'%ns)
    loc=ET.SubElement(node,'{%s}loc'%ns)
    loc.text=BASE if u=='index.html' else BASE+u
ET.ElementTree(root).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
print(f'Phase 3 generated {len(files)} area pages and sitemap with {len(seen)} URLs.')
