/*  KataSpace
 *  chat.js
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
    'katajs/oh/GUISimulation.js'
], function() {

    var SUPER = Kata.GUISimulation.prototype;

    /** Manages a chat UI on a page. Supports multiple chat windows. */
    TransformUI = function(channel) {
        SUPER.constructor.call(this, channel);

        this.mNextDivID = 0;
        this.mForm = null;
    };
    Kata.extend(TransformUI, SUPER);

    TransformUI.prototype._destroy = function() {
        if (this.mForm) {
            try {
                $(this.mForm).remove();
            } catch (e) {
            }
            this.mForm = null;
        }
    };

    TransformUI.prototype._create = function(x, y) {
        // Create a new div to hold it
        this._destroy();
        var divID = this.mNextDivID++;
        var divIDstr = "scalediv" + divID;

        var newDiv = document.createElement('form');
        newDiv.setAttribute('id', divIDstr);
        newDiv.style.position = 'fixed';
        newDiv.style.left = (x-100)+'px';
        newDiv.style.top = (y+1)+'px';
        newDiv.style.textAlign="center";
        newDiv.style.textShadow="black 1px 1px 2px";
        newDiv.style.color="#888";
        newDiv.style.background="rgba(255,255,255,0.6)";
        newDiv.style.borderRadius = "20px";
        document.body.appendChild(newDiv);
        this.mForm = newDiv;

        var label = document.createElement('label');
        label.setAttribute('for', 'scale'+divID);
        label.appendChild(document.createTextNode("Scale:"));
        newDiv.appendChild(label);
        newDiv.appendChild(document.createElement("br"));
        var slider = document.createElement('input');
        slider.setAttribute('name','scale');
        slider.setAttribute('id','scale'+divID);
        slider.setAttribute('type','range');
        slider.setAttribute('min','-0.9');
        slider.setAttribute('max','0.9');
        slider.setAttribute('step','any');
        slider.value = '0';
        slider.style.width="200px";
        slider.addEventListener("change", Kata.bind(this._scaleChanged, this), false);
        //slider.addEventListener("blur", Kata.bind(this._abort, this), false);
        slider.lastvalue = 0;
        newDiv.appendChild(slider);
        newDiv.appendChild(document.createElement("br"));
        var confirm = document.createElement("input");
        confirm.setAttribute('type','button');
        confirm.value = 'OK';
        confirm.addEventListener("click", Kata.bind(this._scaleCommit, this), false);
        newDiv.appendChild(confirm);
        slider.focus();
    };

    TransformUI.prototype._scaleChanged = function(ev) {
        //var relative = arg - ev.target.lastvalue;
        //ev.target.lastvalue = arg;
        this.setScale(this.mForm.scale.value - 0, false);
        this.mForm.didChange = true;
    };
    TransformUI.prototype._scaleCommit = function(ev) {
        if (this.mForm.didChange) {
            this.setScale(this.mForm.scale.value - 0, true);
        }
        this._destroy();
    };

    TransformUI.prototype._abort = function(ev) {
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: 'abort',
                event: {
                    value: newscale,
                    commit: commit
                }
            })
        );
    };
    TransformUI.prototype.setScale = function(arg, commit) {
        var newscale = Math.exp(Math.log((1+arg)/(1-arg)));
        //var value = Math.exp(relative);
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: 'setscale',
                event: {
                    value: newscale,
                    commit: commit
                }
            })
        );
    };

    // GUISimulation interface
    TransformUI.prototype.handleGUIMessage = function(evt) {
        if (evt.msg !== 'transform') return;
        var revt = evt.event;

        if (revt.action == 'show') {
            this._create(revt.x, revt.y);
        }
        else if (revt.action == 'hide') {
            this._destroy();
        }
        else if (revt.action == 'exit') {
        }
    };

});
