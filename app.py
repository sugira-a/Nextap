"""Vercel Flask entrypoint."""

import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

try:
    from backend.run import app
except ImportError:
    from run import app