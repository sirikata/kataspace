#!/usr/bin/python
import os
import sys
import SimpleHTTPServer
import BaseHTTPServer

if len(sys.argv) > 1:
    port = int(sys.argv[1])
else:
    port = 8000

hand = SimpleHTTPServer.SimpleHTTPRequestHandler
httpd = BaseHTTPServer.HTTPServer(('', port), hand)
print "http server on port", port

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print 'stopped'
