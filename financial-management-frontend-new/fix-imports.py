#!/usr/bin/env python3
"""Fix import paths in React/TypeScript files."""

import os
import re
from pathlib import Path

# Define replacement rules based on file location
def get_relative_path(file_path: str, target: str) -> str:
    """Calculate relative path from file to target."""
    file_dir = os.path.dirname(file_path)
    
    # Map of replacements
    mappings = {
        # From different directories to components
        '@components/': {
            'src/app/pages': '../components/',
            'src/app/stores': '../components/',
            'src/app/services': '../components/',
            'src/app/utils': '../components/',
            'src/app/hooks': '../components/',
            'src': './app/components/',
        },
        # From different directories to pages
        '@pages/': {
            'src/app/components': '../pages/',
            'src/app/stores': '../pages/',
            'src/app/services': '../pages/',
            'src/app/utils': '../pages/',
            'src': './app/pages/',
        },
        # From different directories to stores
        '@stores/': {
            'src/app/components': '../stores/',
            'src/app/pages': '../stores/',
            'src/app/services': '../stores/',
            'src/app/utils': '../stores/',
            'src': './app/stores/',
        },
        # From different directories to services
        '@services/': {
            'src/app/components': '../services/',
            'src/app/pages': '../services/',
            'src/app/stores': '../services/',
            'src/app/utils': '../services/',
            'src': './app/services/',
        },
        # From different directories to types
        '@types/': {
            'src/app/components': '../types/',
            'src/app/pages': '../types/',
            'src/app/stores': '../types/',
            'src/app/services': '../types/',
            'src/app/utils': '../types/',
            'src': './app/types/',
        },
        # From different directories to utils
        '@utils/': {
            'src/app/components': '../utils/',
            'src/app/pages': '../utils/',
            'src/app/stores': '../utils/',
            'src/app/services': '../utils/',
            'src/app/types': '../utils/',
            'src': './app/utils/',
        },
        # From different directories to hooks
        '@hooks/': {
            'src/app/components': '../hooks/',
            'src/app/pages': '../hooks/',
            'src/app/stores': '../hooks/',
            'src/app/services': '../hooks/',
            'src': './app/hooks/',
        },
    }
    
    for alias, paths in mappings.items():
        if target.startswith(alias):
            # Find which directory the current file is in
            for dir_path, replacement in paths.items():
                if dir_path in file_path:
                    return target.replace(alias, replacement)
    
    return target

def fix_imports_in_file(file_path: str):
    """Fix imports in a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Replace all @alias imports
    replacements = [
        (r"from ['\"]@components/", "from '../components/"),
        (r"from ['\"]@pages/", "from '../pages/"),
        (r"from ['\"]@stores/", "from '../stores/"),
        (r"from ['\"]@services/", "from '../services/"),
        (r"from ['\"]@types/", "from '../types/"),
        (r"from ['\"]@utils/", "from '../utils/"),
        (r"from ['\"]@hooks/", "from '../hooks/"),
        (r"import ['\"]@components/", "import '../components/"),
        (r"import ['\"]@pages/", "import '../pages/"),
        (r"import ['\"]@stores/", "import '../stores/"),
        (r"import ['\"]@services/", "import '../services/"),
        (r"import ['\"]@types/", "import '../types/"),
        (r"import ['\"]@utils/", "import '../utils/"),
        (r"import ['\"]@hooks/", "import '../hooks/"),
    ]
    
    for pattern, replacement in replacements:
        # Use regex to properly handle quotes
        content = re.sub(
            pattern.replace('[\'"]', r'[\'"]'),
            replacement,
            content
        )
    
    # Write back if changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Fix all imports in the project."""
    src_dir = Path('src')
    
    if not src_dir.exists():
        print(f"Error: {src_dir} not found")
        return
    
    # Find all TypeScript/TSX files
    ts_files = list(src_dir.rglob('*.ts')) + list(src_dir.rglob('*.tsx'))
    
    print(f"Found {len(ts_files)} TypeScript files")
    
    fixed_count = 0
    for file_path in ts_files:
        if fix_imports_in_file(str(file_path)):
            print(f"✓ Fixed: {file_path}")
            fixed_count += 1
        else:
            print(f"✓ Already clean: {file_path}")
    
    print(f"\n✅ Completed! Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
