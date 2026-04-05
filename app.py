"""Vercel Flask entrypoint."""

import os
import sys


ROOT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from run import app