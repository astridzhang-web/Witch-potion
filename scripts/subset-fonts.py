"""Rebuild local UI WOFF2 subsets; see public/fonts/README.md for pinned inputs."""
from pathlib import Path
import re
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
text = ''.join(p.read_text() for p in (root / 'src').rglob('*')
               if p.suffix in ('.ts', '.tsx') and '.test.' not in p.name)
ui = ''.join(chr(i) for i in range(32, 127)) + ''.join(sorted(set(re.findall(r'[^\x00-\x7f]', text))))
for source, chars, family, output in [
    (sys.argv[1], '撤销新谜题重来调配完成', 'Moonlit Display', 'zhenkai-ui.woff2'),
    (sys.argv[2], ui, 'Moonlit Text', 'han-serif-ui.woff2'),
]:
    font = TTFont(source)
    print(source, font['name'].getDebugName(5))
    options = subset.Options()
    options.name_IDs = ['*']  # Retain copyright and license records.
    options.name_legacy = True
    options.name_languages = ['*']
    sub = subset.Subsetter(options=options)
    sub.populate(text=chars)
    sub.subset(font)
    # Modified subset names avoid both projects' Reserved Font Names.
    names = {1: family, 2: 'Regular', 3: family + ' UI 1.0', 4: family,
             6: family.replace(' ', ''), 16: family, 17: 'Regular', 18: family}
    for record in font['name'].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    if 'CFF ' in font:
        cff = font['CFF '].cff
        cff.fontNames = [family.replace(' ', '')]
        cff.topDictIndex[0].FamilyName = family
        cff.topDictIndex[0].FullName = family
    font.flavor = 'woff2'
    path = root / 'public/fonts' / output
    font.save(path)
    print(output, path.stat().st_size, 'bytes;', len(font.getBestCmap()), 'characters')
