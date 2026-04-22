import os, re

src = r'c:\Users\user\Desktop\Nextap\src'

for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            text = fh.read()
        fixed = text
        # â†\x90 = U+00E2 U+2020 U+0090 = ← (left arrow back)
        fixed = fixed.replace('\u00e2\u2020\u0090', '\u2190')
        # â†— = U+00E2 U+2020 + em-dash = ↗ (northeast arrow)
        fixed = fixed.replace('\u00e2\u2020\u2014', '\u2197')
        # Also catch any other â† + misc control chars -> generic arrow
        fixed = re.sub(r'\u00e2\u2020[\x80-\x9f]', '\u2192', fixed)
        if fixed != text:
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(fixed)
            print('Fixed:', f)

print('Done')
