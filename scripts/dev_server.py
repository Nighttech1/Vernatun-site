#!/usr/bin/env python3
"""Local static server with clean URLs: /schedule → schedule.html"""
from __future__ import annotations

import os
import posixpath
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")


class CleanURLHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)
        qs = ("?" + parsed.query) if parsed.query else ""
        if path != "/" and not os.path.splitext(path)[1]:
            rel = path.lstrip("/")
            html_path = os.path.join(ROOT, rel + ".html")
            dir_index = os.path.join(ROOT, rel, "index.html")
            if os.path.isfile(html_path):
                self.path = "/" + rel.replace("\\", "/") + ".html" + qs
            elif os.path.isfile(dir_index):
                self.path = "/" + rel.replace("\\", "/").rstrip("/") + "/index.html" + qs
        return super().do_GET()

    def log_message(self, fmt, *args):
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer((HOST, PORT), CleanURLHandler)
    print(f"Serving {ROOT} on http://{HOST}:{PORT}/ (clean URLs on)", flush=True)
    httpd.serve_forever()
