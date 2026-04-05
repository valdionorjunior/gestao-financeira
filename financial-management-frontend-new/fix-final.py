#!/usr/bin/env python3
import re
from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Fix imports - replace @alias with relative path
    content = re.sub(r"from ['\"]@types['\"]", "from '../types'", content)
    content = re.sub(r"from ['\"]@utils['\"]", "from '../utils/formatters'", content)
    content = re.sub(r"from ['\"]@stores['\"]", "from '../stores'", content)
    content = re.sub(r"from ['\"]@pages['\"]", "from '../pages'", content)
    content = re.sub(r"from ['\"]@components['\"]", "from '../components'", content)
    content = re.sub(r"from ['\"]@services['\"]", "from '../services'", content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

src = Path('src')
fixed = 0
for f in sorted(src.rglob('*.ts*')):
    if fix_file(str(f)):
        print(f"✓ Fixed: {f}")
        fixed += 1
        
print(f"\n✅ Fixed {fixed} files!")
