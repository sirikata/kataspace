
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
ALL_PBJJS := $(ALL_PBJJS) $(THESE_PBJJS)
### Animated
ANIMATED_PROTOCOL_INPUT=scripts/behavior/animated
ANIMATED_PROTOCOL_OUTPUT=scripts/behavior/animated
THESE_PBJ=$(wildcard $(ANIMATED_PROTOCOL_INPUT)/*.pbj)
THESE_PBJJS=$(patsubst $(ANIMATED_PROTOCOL_INPUT)/%,$(ANIMATED_PROTOCOL_OUTPUT)/%.js,$(THESE_PBJ))
ALL_PBJJS := $(ALL_PBJJS) $(THESE_PBJJS)


### Rules

all : submodules katajs $(ALL_PBJJS) jquery-ui jnotify

### PBJ Rules

$(PBJBIN) :
	cd $(PBJDIR) &&	\
	./bootstrap.sh && \
	$(MAKE)

$(CHAT_PROTOCOL_OUTPUT)/%.pbj.js: $(CHAT_PROTOCOL_INPUT)/%.pbj
	@mkdir $(CHAT_PROTOCOL_OUTPUT) 2>/dev/null || true
	$(PBJBIN) $< $@

$(ANIMATED_PROTOCOL_OUTPUT)/%.pbj.js: $(ANIMATED_PROTOCOL_INPUT)/%.pbj
	@mkdir $(ANIMATED_PROTOCOL_OUTPUT) 2>/dev/null || true
	$(PBJBIN) $< $@

# Submodules intialization

katajs : katajs-submodules
	$(MAKE) -C externals/katajs
	$(MAKE) -C externals/katajs closure

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
JQUERY_UI_VERSION=1.8.9
JQUERY_UI_URL=http://jqueryui.com/download/jquery-ui-$(JQUERY_UI_VERSION).custom.zip
JQUERY_UI_ZIP=jquery-ui-$(JQUERY_UI_VERSION).custom.zip
JQUERY_UI_FULL_ZIP=$(JQUERY_DIR)/$(JQUERY_UI_ZIP)
JQUERY_UI_FILE=jquery-ui

jquery-ui : $(JQUERY_UI_FULL_ZIP)
	cd $(JQUERY_DIR) && \
	unzip -u $(JQUERY_UI_ZIP)

$(JQUERY_UI_FULL_ZIP) :
	cd $(JQUERY_DIR) && \
	wget -O $(JQUERY_UI_ZIP) $(JQUERY_UI_URL)


JNOTIFY_DIR=externals
JNOTIFY_URL=http://www.givainc.com/labs/downloads/jquery.jnotify.zip
JNOTIFY_ZIP=jnotify.zip
JNOTIFY_FULL_ZIP=$(JNOTIFY_DIR)/$(JNOTIFY_ZIP)

jnotify : $(JNOTIFY_FULL_ZIP)
	cd $(JNOTIFY_DIR) && \
	unzip -u $(JNOTIFY_ZIP)

$(JNOTIFY_FULL_ZIP) :
	cd $(JNOTIFY_DIR) && \
	wget -O $(JNOTIFY_ZIP) $(JNOTIFY_URL)


.PHONY : submodules our-submodules katajs-submodules katajs jquery-ui jnotify
