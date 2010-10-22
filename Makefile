
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

all : submodules katajs $(ALL_PBJJS) jquery-ui

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

katajs-submodules : our-submodules
	cd externals/katajs && \
	git submodule init && \
	git submodule update

our-submodules :
	git submodule init && \
	git submodule update

submodules : our-submodules katajs-submodules

# JQuery initialization

JQUERY_DIR=externals
JQUERY_UI_VERSION=1.8.5
JQUERY_UI_URL=http://jqueryui.com/download/jquery-ui-$(JQUERY_UI_VERSION).custom.zip
JQUERY_UI_ZIP=jquery-ui-$(JQUERY_UI_VERSION).custom.zip
JQUERY_UI_FILE=jquery-ui

jquery-ui :
	cd $(JQUERY_DIR) && \
	wget -O $(JQUERY_UI_ZIP) $(JQUERY_UI_URL) && \
	unzip $(JQUERY_UI_ZIP)

.PHONY : submodules our-submodules katajs-submodules katajs jquery-ui
