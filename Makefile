
### PBJ Vars
PBJDIR=externals/katajs/externals/protojs
PBJBIN=$(PBJDIR)/pbj

# Protocols
## Behaviors
### Chat
CHAT_PROTOCOL_INPUT=scripts/behavior/chat
CHAT_PROTOCOL_OUTPUT=scripts/behavior/chat
THESE_PBJ=$(wildcard $(CHAT_PROTOCOL_INPUT)/*.pbj)
THESE_PBJJS=$(patsubst $(CHAT_PROTOCOL_INPUT)/%,$(CHAT_PROTOCOL_OUTPUT)/%.js,$(THESE_PBJ))
ALL_PBJJS += $(THESE_PBJJS)


### Rules

all : submodules katajs $(ALL_PBJJS)

### PBJ Rules

$(PBJBIN) :
	cd $(PBJDIR) &&	\
	./bootstrap.sh && \
	$(MAKE)

$(CHAT_PROTOCOL_OUTPUT)/%.pbj.js: $(CHAT_PROTOCOL_INPUT)/%.pbj
	@mkdir $(CHAT_PROTOCOL_OUTPUT) 2>/dev/null || true
	$(PBJBIN) $< $@

# Submodules intialization

katajs : katajs-submodules
	$(MAKE) -C externals/katajs

katajs-submodules :
	cd externals/katajs && \
	git submodule init && \
	git submodule update

submodules : katajs-submodules


.PHONY : submodules katajs-submodules katajs
