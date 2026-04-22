import os, re

# Fix 1: AdminCards.tsx line 200 - "âœ"" is ✓ (check mark) mojibake
# â=U+00E2, œ=U+0153, "=U+201D -> the UTF-8 bytes for ✓ (U+2713) are E2 9C 93
# When read as latin-1 then displayed as UTF-8 mojibake: â + 9C (control) + "
# Let's check exact bytes

path1 = r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminCards.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    lines = f.readlines()
line = lines[199]  # line 200 (0-indexed)
# Find the bad sequence around âœ
idx = line.find('\u00e2\u0153')
print('AdminCards line 200 raw:', repr(line.strip()))
# Check each char around position of â
for i, c in enumerate(line):
    if ord(c) > 127:
        print(f'  pos {i}: U+{ord(c):04X} ({c!r})')
