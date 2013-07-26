chrome:
	@mkdir -p dist
	git archive -o dist/caoliu-previewer.`git log -1 --format="%h"`.zip HEAD
domains:
	@python ./findDomains.py -m -w -a www.1024cl.tk,1024cl.tk
