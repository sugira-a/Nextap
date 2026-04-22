import os, re

fixes = {
    r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminCards.tsx': [
        # âœ" = U+00E2 U+0153 U+201D = ✓ (checkmark, U+2713, UTF-8 bytes E2 9C 93 decoded as Windows-1252)
        ('\u00e2\u0153\u201d', '\u2713'),
        # Also catch variant with straight quote
        ('\u00e2\u0153"', '\u2713'),
    ],
    r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminOverview.tsx': [
        # -> in JSX text is invalid; replace with unicode arrow →
        ('\n              View all ->\n', '\n              View all \u2192\n'),
        ('>{"->"}<', '>\u2192<'),
        # Catch bare -> in span text
        ('>-><', '>\u2192<'),
    ],
}

# Also do a broad scan for all files with -> inside JSX text (between > and <)
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
        # Apply file-specific fixes
        if path in fixes:
            for bad, good in fixes[path]:
                fixed = fixed.replace(bad, good)

        # Global fix: replace remaining mojibake checkmark variant
        fixed = fixed.replace('\u00e2\u0153\u201d', '\u2713')
        fixed = fixed.replace('\u00e2\u0153"', '\u2713')

        # Replace -> between JSX tags (>...->...<) with unicode arrow
        # Pattern: >  some text ->  some text < — but be careful not to hit JSX attributes
        # Only replace when -> is in plain text nodes (between > ... <)
        fixed = re.sub(r'(>[^<{]*)->([^<{]*<)', lambda m: m.group(1) + '\u2192' + m.group(2), fixed)

        if fixed != text:
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(fixed)
            print('Fixed:', f)

print('Done')
