#!/usr/bin/env python

"""Query domain names by ipaddr
   Requriment: pyquery
"""

try:
  from pyquery import PyQuery as pq
except ImportError:
  raise Exception("pyquery module is required. You can install pyquery with pip")

import urllib
import re
import sys
import socket
import threading

class DNSReverse(object):
  BASE = "http://dns.aizhan.com/"
  url = None
  def __init__(self, ipaddr = None, page = None, url = None):
    self.domains = []
    query = {}
    if ipaddr != None: query['q'] = ipaddr
    if page != None: query['page'] = page

    if len(query) > 0:
      self.url = self.BASE + '?' + urllib.urlencode(query)
    else:
      self.url = self.BASE + url


  def __call__(self, recursive = True):
    if not self.url:
      raise Exception('url empty')
    sys.stderr.write('Querying page %s\n' % self.url)

    doc = pq(url=self.url)
    for elem in doc('input'):
      eid = elem.attrib.get('id', None)
      val = elem.attrib.get('value', None)
      if eid and re.match(r'^domain\d+$', eid.strip(), re.I) and val:
        if re.match(r'^[0-9a-z\-\.]+$', val.strip()):
          self.domains.append(val)

    # pagenation
    if recursive:
      hrefs = []
      for anchor in doc('.page a'):
        href = anchor.attrib.get('href', None)
        if href: hrefs.append(href)
      for href in set(hrefs):
        self.domains += self.__class__(url = href)(recursive = False)

    return list(set(self.domains))

def checkDomain(total_domains):
  availURIs = []
  threads = []
  for domain in total_domains:
    def target(domain, availURIs):
      try:
        sys.stderr.write('Verifying %s\n' % domain)
        sys.stderr.flush()
        socket.getaddrinfo(domain, 80)
        availURIs.append("http://%s/*" % domain)
      except socket.gaierror:
        sys.stderr.write('Domain %s is unreachable.\n' % domain)

    thread = threading.Thread(target = target, args = (domain, availURIs))
    threads.append(thread)
    thread.start()

  for thread in threads:
    thread.join()

def main():
  ips = ['184.154.128.243',
      '184.154.128.244',
      '184.154.128.245',
      '184.154.128.246']

  total_domains = []
  for ip in ips:
    domains = DNSReverse(ipaddr = ip)()
    sys.stderr.write("Domains of %s: %s\n" % (ip, domains))
    total_domains += domains

  availURIs = ['"http://%s/*"' % domain for domain in set(total_domains)]

  sys.stderr.write("Caoliu domains: \n")
  sys.stdout.write(',\n'.join(availURIs))

if __name__ == '__main__':
  main()

