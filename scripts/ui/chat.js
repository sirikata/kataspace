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

Kata.include("katajs/oh/GUISimulation.js");

Kata.defer(function() {

    var SUPER = Kata.GUISimulation.prototype;

    /** Manages a chat UI on a page. Supports multiple chat windows. */
    ChatUI = function(channel, width) {
        SUPER.constructor.call(this, channel);

        this.mWidth = width; // width of chat boxes
        this.mGap = 30;

        this.mNextDivID = 0;
        this.mChats = [];
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
        // to insert a message
        //$("#chat_div").chatbox("option", "boxManager").addMsg("Mr. Foo", "Barrr!");
    };

    // Reflow the layout of the chat boxes
    ChatUI.prototype.reflow = function() {
        var cur_offset = 0;
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
        Kata.warn('' + evt.event.name + ' ' + evt.event.action);
    };

});