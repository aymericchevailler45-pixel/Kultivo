# Police « KCoin » : un seul caractère, 🪙 (U+1FA99), dessiné en pièce dorée avec le K (couleurs COLR v0).
import base64, math
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.ttLib.tables import otTables
from fontTools.colorLib.builder import buildCOLR, buildCPAL

ADV = 1100
CX, CY = 550, 330


def circle(pen, cx, cy, r):
    k = 0.5523 * r
    pen.moveTo((cx + r, cy))
    pen.curveTo((cx + r, cy + k), (cx + k, cy + r), (cx, cy + r))
    pen.curveTo((cx - k, cy + r), (cx - r, cy + k), (cx - r, cy))
    pen.curveTo((cx - r, cy - k), (cx - k, cy - r), (cx, cy - r))
    pen.curveTo((cx + k, cy - r), (cx + r, cy - k), (cx + r, cy))
    pen.closePath()


def kpath(pen):
    # même K que le logo (SVG, y vers le bas) : M0 0h52v66l64-66h66l-86 86 90 102h-66l-62-73-6 7v66h-52z
    pts = [(0, 0), (52, 0), (52, 66), (116, 0), (182, 0), (96, 86), (186, 188), (120, 188), (58, 115), (52, 122), (52, 188), (0, 188)]
    s = 2.6
    w, h = 186 * s, 188 * s
    ox, top = CX - w / 2, CY + h / 2 - 10
    p = [(ox + x * s, top - y * s) for x, y in pts]
    p = p[::-1]   # sens inverse des aiguilles d'une montre (contour extérieur CFF)
    pen.moveTo(p[0])
    for q in p[1:]:
        pen.lineTo(q)
    pen.closePath()


def glyph(draw):
    pen = T2CharStringPen(ADV, None)
    draw(pen)
    return pen.getCharString()


glyphs = {
    '.notdef': glyph(lambda p: None),
    'coin': glyph(lambda p: None),
    'ring': glyph(lambda p: circle(p, CX, CY, 475)),
    'gold': glyph(lambda p: circle(p, CX, CY + 22, 430)),
    'shine': glyph(lambda p: circle(p, CX - 20, CY + 60, 350)),
    'k': glyph(kpath),
}
order = list(glyphs)
fb = FontBuilder(1000, isTTF=False)
fb.setupGlyphOrder(order)
fb.setupCharacterMap({0x1FA99: 'coin'})
fb.setupCFF('KCoin', {'FullName': 'KCoin'}, glyphs, {})
fb.setupHorizontalMetrics({g: (ADV, 0) for g in order})
fb.setupHorizontalHeader(ascent=900, descent=-200)
fb.setupNameTable({'familyName': 'KCoin', 'styleName': 'Regular'})
fb.setupOS2(sTypoAscender=900, sTypoDescender=-200, usWinAscent=900, usWinDescent=200)
fb.setupPost()
font = fb.font
font['CPAL'] = buildCPAL([[(0xC9 / 255, 0x8F / 255, 0, 1), (0xF5 / 255, 0xB8 / 255, 0, 1), (0xFF / 255, 0xD4 / 255, 0x3B / 255, 1), (0x8A / 255, 0x5A / 255, 0, 1)]])
font['COLR'] = buildCOLR({'coin': [('ring', 0), ('gold', 1), ('shine', 2), ('k', 3)]}, version=0)
out = r'C:\Users\aymer\Bureau\Culture-G-App\icons\kcoin.otf'
font.save(out)
data = open(out, 'rb').read()
print(len(data), 'octets')
open(out.replace('.otf', '.b64'), 'w').write(base64.b64encode(data).decode())
