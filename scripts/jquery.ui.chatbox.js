/*
 * Copyright 2010, Wen Pu (dexterpu at gmail dot com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Check out http://www.cs.illinois.edu/homes/wenpu1/chatbox.html for document
 *
 * Depends on jquery.ui.core, jquery.ui.widiget, jquery.ui.effect
 * 
 * Also uses some styles for jquery.ui.dialog
 * 
 */


// TODO: implement destroy()
(function($){
    var orig_title = document.title;
    var num_outstanding = 0;
    $.widget("ui.chatbox", {
	options: {
	    id: null, //id for the DOM element
	    title: null, // title of the chatbox
	    user: null, // can be anything associated with this chatbox
	    hidden: false,
	    offset: 0, // relative to right edge of the browser window
	    width: 360, // width of the chatbox
	    messageSent: function(id, user, msg){
		// override this
		this.boxManager.addMsg(user.first_name, msg);
	    },
	    boxClosed: function(id) {}, // called when the close icon is clicked
	    boxManager: {
		// thanks to the widget factory facility
		// similar to http://alexsexton.com/?p=51
		init: function(elem) {
		    this.elem = elem;
		},
		addMsg: function(peer, msg) {
		    var self = this;
		    var box = self.elem.uiChatboxLog;
		    var e = document.createElement('div');
		    $(e).html("<b>" + peer +":</b> " + msg)
			.addClass("ui-chatbox-msg");
		    box.append(e);
		    self._scrollToBottom();

		    if (!self.elem.uiChatboxTitlebar.hasClass("ui-state-focus")) {
                        if (!self.highlightLock) {
			    self.highlightLock = true;
			    self.highlightBox();
                        }
                        num_outstanding++;
                        document.title = '(' + num_outstanding + ') - ' + orig_title;
		    }
		},
                addBuddy: function(name) {
                    if (!this.buddies) this.buddies = {};

                    var buddy = $('<li>' + name + '</li>')
                        .appendTo(this.elem.uiChatboxBuddyListList)
                        .addClass('ui-widget-content ui-chatbox-buddy');
                    this.buddies[name] = buddy;
                },
                removeBuddy: function(name) {
                    var buddy = this.buddies[name];
                    if (!buddy) return;
                    buddy.hide(
                        'highlight', {}, 1000,
                        function() {
                            buddy.remove();
                        }
                    );
                },
		highlightBox: function() {
		    this.elem.uiChatbox.addClass("ui-state-error");
		    this.elem.uiChatboxTitlebar.addClass("ui-state-error");
                    this.highlightLock = false;
		    this._scrollToBottom();
		},
		toggleBox: function() {
		    this.elem.uiChatbox.toggle();
		},
		_scrollToBottom: function() {
		    var box = this.elem.uiChatboxLog;
		    box.scrollTop(box.get(0).scrollHeight);
		},
	    }
	},

	toggleContent: function(event) {
	    this.uiChatboxContent.toggle();
	    if(this.uiChatboxContent.is(":visible")) {
		this.uiChatboxInputBox.focus();
	    }
	},

	widget: function() {
	    return this.uiChatbox
	},

	_create: function(){
	    var self = this,
	    options = self.options,
	    title = options.title || "No Title",
	    // chatbox
	    uiChatbox = (self.uiChatbox = $('<div></div>'))
		.appendTo(document.body)
		.addClass('ui-widget ' + 
			  'ui-corner-top ' + 
			  'ui-chatbox'
			 )
		.attr('outline', 0)
		.focusin(function(){
                    self.highlightLock = true;
		    self.uiChatbox.removeClass("ui-state-error");
		    self.uiChatboxTitlebar.removeClass("ui-state-error");
		    self.uiChatboxTitlebar.addClass('ui-state-focus');

                    num_outstanding = 0;
                    document.title = orig_title;
		})
		.focusout(function(){
		    self.highlightLock = false;
		    self.uiChatboxTitlebar.removeClass('ui-state-focus');
		}),
	    // titlebar
	    uiChatboxTitlebar = (self.uiChatboxTitlebar = $('<div></div>'))
		.addClass('ui-widget-header ' +
			  'ui-corner-top ' +
			  'ui-chatbox-titlebar ' +
			  'ui-dialog-header' // take advantage of dialog header style
			 )
		.click(function(event) {
		    self.toggleContent(event);
		})
		.appendTo(uiChatbox),
	    uiChatboxTitle = (self.uiChatboxTitle = $('<span></span>'))
		.html(title)
		.appendTo(uiChatboxTitlebar),
	    uiChatboxTitlebarClose = (self.uiChatboxTitlebarClose = $('<a href="#"></a>'))
		.addClass('ui-corner-all ' +
			  'ui-chatbox-icon '
			 )
		.attr('role', 'button')
		.hover(function() {uiChatboxTitlebarClose.addClass('ui-state-hover');},
		       function() {uiChatboxTitlebarClose.removeClass('ui-state-hover');})
		// .focus(function() {
		//     uiChatboxTitlebarClose.addClass('ui-state-focus');
		// })
		// .blur(function() {
		//     uiChatboxTitlebarClose.removeClass('ui-state-focus');
		// })
		.click(function(event) {
		    uiChatbox.hide();
		    self.options.boxClosed(self.options.id);
		    return false;
		})
		.appendTo(uiChatboxTitlebar),
	    uiChatboxTitlebarCloseText = $('<span></span>')
		.addClass('ui-icon ' +
			  'ui-icon-closethick')
		.text('close')
		.appendTo(uiChatboxTitlebarClose),
	    uiChatboxTitlebarMinimize = (self.uiChatboxTitlebarMinimize = $('<a href="#"></a>'))
		.addClass('ui-corner-all ' + 
			  'ui-chatbox-icon'
			 )
		.attr('role', 'button')
		.hover(function() {uiChatboxTitlebarMinimize.addClass('ui-state-hover');},
		       function() {uiChatboxTitlebarMinimize.removeClass('ui-state-hover');})
		// .focus(function() {
		//     uiChatboxTitlebarMinimize.addClass('ui-state-focus');
		// })
		// .blur(function() {
		//     uiChatboxTitlebarMinimize.removeClass('ui-state-focus');
		// })
		.click(function(event) {
		    self.toggleContent(event);
		    return false;
		})
		.appendTo(uiChatboxTitlebar),
	    uiChatboxTitlebarMinimizeText = $('<span></span>')
		.addClass('ui-icon ' +
			  'ui-icon-minusthick')
		.text('minimize')
		.appendTo(uiChatboxTitlebarMinimize),
	    // content
	    uiChatboxContent = (self.uiChatboxContent = $('<div></div>'))
		.addClass('ui-widget-content ' +
			  'ui-chatbox-content '
			 )
		.appendTo(uiChatbox),
	    uiChatboxBuddyList = (self.uiChatboxBuddyList = $('<div></div>'))
		.addClass('ui-widget-content '+
			  'ui-chatbox-buddy-list'
			 )
		.appendTo(uiChatboxContent),
            uiChatboxBuddyListTitle = $('<p>Participants</p>')
                .addClass('ui-chatbox-buddy-list-title')
                .appendTo(self.uiChatboxBuddyList),
            uiChatboxBuddyListList = (self.uiChatboxBuddyListList = $('<ol></ol>'))
                .addClass('ui-chatbox-buddy-list-list')
                .appendTo(self.uiChatboxBuddyList),
	    uiChatboxLog = (self.uiChatboxLog = self.element)
		//.show()
		.addClass('ui-widget-content '+
			  'ui-chatbox-log'
			 )
		.appendTo(uiChatboxContent),
	    uiChatboxInput = (self.uiChatboxInput = $('<div></div>'))
		.addClass('ui-widget-content ' + 
			 'ui-chatbox-input'
			 )
		.click(function(event) {
		    // anything?
		})
		.appendTo(uiChatboxContent),
	    uiChatboxInputBox = (self.uiChatboxInputBox = $('<textarea></textarea>'))
		.addClass('ui-widget-content ' + 
			  'ui-chatbox-input-box ' +
			  'ui-corner-all'
			 )
		.appendTo(uiChatboxInput)
	        .keydown(function(event) {
		    if(event.keyCode && event.keyCode == $.ui.keyCode.ENTER) {
			msg = $.trim($(this).val());
			if(msg.length > 0) {
			    self.options.messageSent(self.options.id, self.options.user, msg);
			}
			$(this).val('');
			return false;
		    }
		})
		.focusin(function() {
		    uiChatboxInputBox.addClass('ui-chatbox-input-focus');
		    var box = $(this).parent().prev();
		    box.scrollTop(box.get(0).scrollHeight);
		})
		.focusout(function() {
		    uiChatboxInputBox.removeClass('ui-chatbox-input-focus');
		});

	    // disable selection
	    uiChatboxTitlebar.find('*').add(uiChatboxTitlebar).disableSelection();

	    // switch focus to input box when whatever clicked
	    uiChatboxContent.children().click(function(){
		// click on any children, set focus on input box
		self.uiChatboxInputBox.focus();
	    });

	    self._setWidth(self.options.width);
	    self._position(self.options.offset);

	    self.options.boxManager.init(self);

            // No close buttons
            uiChatboxTitlebarClose.hide();

	    if(!self.options.hidden) {
		uiChatbox.show();
	    }
	},

	_setOption: function(option, value) {
	    if(value != null){
		switch(option) {
		case "hidden":
		    if(value) {
			this.uiChatbox.hide();
		    }
		    else {
			this.uiChatbox.show();
		    }
		    break;
		case "offset":
		    this._position(value);
		    break;
		case "width":
		    this._setWidth(value);
		    break;
		}
	    }

	    $.Widget.prototype._setOption.apply(this, arguments);
	},

	_setWidth: function(width) {
            // We use 100px for the buddy list and the rest for the log. 3px spacing.
            var buddy_width = 100;
            var log_width = width - buddy_width - 3;

	    this.uiChatboxTitlebar.width((width+3) + "px");
	    this.uiChatboxBuddyList.width(buddy_width + "px");
	    this.uiChatboxLog.width(log_width + "px");
	    // this is a hack, but i can live with it so far
	    this.uiChatboxInputBox.css("width", (width - 24) + "px");
	},

	_position: function(offset) {
	    this.uiChatbox.css("right", offset);
	}
    });

}(jQuery));