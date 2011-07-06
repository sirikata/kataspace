/*  KataSpace
 *  piemenu.js
 *
 *  Copyright (c) 2011, Patrick Reiter Horn
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
    '../../scripts/jquery.ui.prettypiemenu.js'
], function() {

    var SUPER = Kata.GUISimulation.prototype;

    /** Manages a chat UI on a page. Supports multiple chat windows. */
    PieUI = function(channel) {
        SUPER.constructor.call(this, channel);

    };
    Kata.extend(PieUI, SUPER);

    PieUI.prototype._destroy = function() {
        if (this.mPie) {
            try {
                $(this.mPie).hide();
            } catch (e) {
            }
            this.mPie = null;
            this.mButtons = null;
        }
    };


    PieUI.prototype._create = function(x, y, buttons) {
        this._destroy();
        this.mPie = $("<span></span>");
        this.mPie.prettypiemenu(
            {
                buttons: buttons,
                onSelection: Kata.bind(this._selected, this),
                onAbort: Kata.bind(this._aborted, this),
                showTitles: false
            });
        this.mStartX = x;
        this.mStartY = y;
        this.mButtons = buttons;
        this.mPie.prettypiemenu('show', {top: y, left: x});
    };

    PieUI.prototype._selected = function(which, elem, ev) {
        this._commit(which, ev.pageX - this.mStartX, ev.pageY - this.mStartY);
        this.mButtons = null;
        this.mPie = null;
    };

    PieUI.prototype._aborted = function(elem, ev) {
        this.mButtons = null;
        this.mPie = null;
    };

    PieUI.prototype._commit = function(which, dx, dy) {
        var button = this.mButtons[which];
        
        var event = {
            x: this.mStartX,
            y: this.mStartY,
            deltaX: dx,
            deltaY: dy,
            msg: button.msg
        };
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: "pieaction",
                event: event
            })
        );
    };

    // GUISimulation interface
    PieUI.prototype.handleGUIMessage = function(evt) {
        if (evt.msg !== 'pie') return;
        var revt = evt.event;

        if (revt.action == 'show') {
            this._create(revt.x, revt.y, revt.buttons);
        }
        else if (revt.action == 'hide') {
            this._destroy();
        }
    };
});
