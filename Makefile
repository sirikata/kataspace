
all : submodules katajs

katajs : katajs-submodules
	$(MAKE) -C externals/katajs

katajs-submodules :
	cd externals/katajs && \
	git submodule init && \
	git submodule update

submodules : katajs-submodules


.PHONY : submodules katajs-submodules katajs