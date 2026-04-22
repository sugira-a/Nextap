import os

src = r'c:\Users\user\Desktop\Nextap\src'

# Characters to replace:
# U+201C left double quotation mark -> ASCII "
# U+201D right double quotation mark -> ASCII "
# U+2018 left single quotation mark -> ASCII '
# U+2019 right single quotation mark -> ASCII '
# â†' (arrow mojibake): â=U+00E2, †=U+2020, '=U+2019 -> ->

replacements = [
    ('\u201c', '"'),
    ('\u201d', '"'),
    ('\u2018', "'"),
    ('\u2019', "'"),
    ('\u00e2\u2020\u2019', '->'),  # arrow â†'
]

for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            text = fh.read()
        fixed = text
        for bad, good in replacements:
            fixed = fixed.replace(bad, good)
        if fixed != text:
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(fixed)
            print('Fixed:', f)

print('Done')
