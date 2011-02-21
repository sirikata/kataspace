/*  KataSpace
 *  sit.js
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
    'katajs/oh/GUISimulation.js'
], function() {

    var SUPER = Kata.GUISimulation.prototype;

    /** Tracks session events, presenting an error message if on disconnection. */
    SitUI = function(channel, parent) {
        SUPER.constructor.call(this, channel);

        this.sitting = false; // Whether we are sitting or not

        var button_div = $('<button>Sit</button>').appendTo($('body'));
        this.button = button_div;
        button_div.button().click(
            Kata.bind(this.toggleSit, this)
        );
        parent.addButton(button_div);
        this.parent = parent;
    };
    Kata.extend(SitUI, SUPER);

    // GUISimulation interface
    SitUI.prototype.handleGUIMessage = function(evt) {
        var revt = evt.event;
        if (evt.msg !== 'sit') return;
        this.sitting = revt.sitting;
        this._updateButton();
    };

    SitUI.prototype._updateButton = function() {
        var label = (this.sitting ? 'Stand Up' : 'Sit');
        this.button[0].innerHTML = label;
        this.parent.reflow();
    };

    SitUI.prototype.toggleSit = function() {
        this.sitting = !this.sitting;
        this._updateButton();
        // Send the message
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage(
                {
                    msg : 'sit',
                    event : {}
                }
            )
        );
    };
});
