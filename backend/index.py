"""Vercel Flask entrypoint."""

try:
	from run import app
except ModuleNotFoundError:
	from backend.run import app
