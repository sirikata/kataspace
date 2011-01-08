/*  KataSpace
 *  chat.js
 *
 *  Copyright (c) 2010, Ewen Cheslack-Postava
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of Sirikata nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

Kata.require([
    'katajs/oh/GUISimulation.js',
    '../../scripts/util/url.js'
], function() {

    var SUPER = Kata.GUISimulation.prototype;

    /** Manages a chat UI on a page. Supports multiple chat windows. */
    ChatUI = function(channel, name, width) {
        SUPER.constructor.call(this, channel);

        this.mName = name;

        this.mWidth = width; // width of chat boxes
        this.mGap = 30;

        this.mNextDivID = 0;
        this.mChats = [];

        // We might later support multiple chat windows. For now we're
        // just doing one large community chat, like IRC
        this.mSingle = true;
    };
    Kata.extend(ChatUI, SUPER);

    ChatUI.prototype.create = function(title) {
        // Create a new div to hold it
        var divID = this.mNextDivID++;
        var newdiv = document.createElement('div');
        var divIDstr = "chatdiv" + divID;
        newdiv.setAttribute('id', divIDstr);

        $(newdiv).chatbox({id : divIDstr,
                                 title : title,
                                 // offset doesn't matter, we just reflow
                                 offset : 200,
                                 width : this.mWidth,
                                 messageSent : this._getMessageSentHandler(),
                                 boxClosed : this._getClosedHandler()
                                });
        this.mChats.push(divIDstr);

        this.reflow();
    };

    // Reflow the layout of the chat boxes
    ChatUI.prototype.reflow = function() {
        var cur_offset = 10;
        for(var idx = 0; idx < this.mChats.length; idx++) {
            var chatdiv = $("#"+this.mChats[idx]);
            // Set to current offest
            chatdiv.chatbox("option", "offset", cur_offset);
            // And increment for the next guy
            var offset = chatdiv.chatbox("option", "width");
            cur_offset += offset + this.mGap;
        }
    };

    ChatUI.prototype._handleMessageSent = function(id, user, msg) {
        // Update the box
        var chatdiv = $("#"+this.mChats[0]); // FIXME only works for single mode
        var display_msg = URL.convertURLsToLinks(msg, true);
        chatdiv.chatbox("option", "boxManager").addMsg(this.mName, display_msg);
        // Send the message
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage(
                {
                    msg : 'chat',
                    event: { msg : msg }
                }
            )
        );
    };
    ChatUI.prototype._getMessageSentHandler = function() {
        var self = this;
        return function(id, user, msg) {
            self._handleMessageSent(id, user, msg);
        };
    };

    ChatUI.prototype._handleClosed = function(id) {
        this.mChats = this.mChats.filter(
            function(el) { return el !== id; }
        );
        this.reflow();
    };
    ChatUI.prototype._getClosedHandler = function() {
        var self = this;
        return function(id) {
            self._handleClosed(id);
        };
    };


    // GUISimulation interface
    ChatUI.prototype.handleGUIMessage = function(evt) {
        var revt = evt.event;

        // If we're in single chat mode with no chats, there's nothing to do
        if (this.mSingle && this.mChats.length == 0) return;

        if (revt.action == 'enter') {
            var chatdiv = $("#"+this.mChats[0]); // FIXME only works for single mode
            chatdiv.chatbox("option", "boxManager").addBuddy(revt.name);
        }
        else if (revt.action == 'say') {
            var chatdiv = $("#"+this.mChats[0]); // FIXME only works for single mode
            var display_msg = URL.convertURLsToLinks(revt.msg, true);
            chatdiv.chatbox("option", "boxManager").addMsg(revt.name, display_msg);
        }
        else if (revt.action == 'exit') {
            var chatdiv = $("#"+this.mChats[0]); // FIXME only works for single mode
            chatdiv.chatbox("option", "boxManager").removeBuddy(revt.name);
        }
    };

});
