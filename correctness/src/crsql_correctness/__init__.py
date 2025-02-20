import sqlite3

extension = '../dist/crsqlite'
def connect(db_file):
  c = sqlite3.connect(db_file)
  c.enable_load_extension(True)
  c.load_extension(extension)
  return c

min_db_v = 0