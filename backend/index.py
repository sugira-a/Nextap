"""Vercel Flask entrypoint."""

try:
	from backend.run import app
except ModuleNotFoundError:
	from run import app
