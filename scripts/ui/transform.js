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
            this.mForm.destroyed = true;
            this.mForm = null;
        }
    };
    TransformUI.prototype._addSliderUI = function(divID, parentDiv, label, name, func) {
        var labelEl = document.createElement('label');
        labelEl.setAttribute('for', name+divID);
        labelEl.appendChild(document.createTextNode(label + ":"));
        parentDiv.appendChild(labelEl);
        parentDiv.appendChild(document.createElement("br"));
        var slider = document.createElement('input');
        slider.setAttribute('name',name);
        slider.setAttribute('id',name+divID);
        slider.setAttribute('type','range');
        slider.setAttribute('step','any');
        slider.value = '0';
        slider.style.width="200px";
        slider.addEventListener("change", func, false);
        //slider.addEventListener("blur", Kata.bind(this._abort, this), false);
        slider.lastvalue = 0;
        parentDiv.appendChild(slider);
        parentDiv.appendChild(document.createElement("br"));
        return slider;
    };

    TransformUI.prototype._create = function(x, y) {
        // Create a new div to hold it
        this._destroy();
        var divID = this.mNextDivID++;
        var divIDstr = "transformdiv" + divID;
        var slider;

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
        this.mForm.allowCommit = true;

        slider = this._addSliderUI(divID, newDiv, 'Scale', 'scale', Kata.bind(this._changed, this));
        slider.setAttribute('min','-0.9');
        slider.setAttribute('max','0.9');

        slider = this._addSliderUI(divID, newDiv, 'Rotation', 'rotateX', Kata.bind(this._changed, this));
        slider.setAttribute('min',-Math.PI/2);
        slider.setAttribute('max',Math.PI/2.0);

        var row1 = document.createElement("div");
        newDiv.appendChild(row1);
        var row2 = document.createElement("div");
        newDiv.appendChild(row2);
        var confirm = document.createElement("input");
        confirm.setAttribute('type','button');
        confirm.value = 'Reset';
        confirm.addEventListener("click", Kata.bind(this._abort, this), false);
        row1.appendChild(confirm);

        var snap = document.createElement("input");
        snap.setAttribute('type','button');
        snap.value = 'Snap';
        snap.addEventListener("click", Kata.bind(this._snap, this), false);
        row1.appendChild(snap);

        var delobj = document.createElement("input");
        delobj.setAttribute('type','button');
        delobj.value = 'Delete Object';
        delobj.addEventListener("click", Kata.bind(this._delete_object, this), false);
        row2.appendChild(delobj);
    };

    TransformUI.prototype._changed = function(ev) {
        //var relative = arg - ev.target.lastvalue;
        //ev.target.lastvalue = arg;
        var thus = this;
        var form = thus.mForm;
        if (form.allowCommit) {
            var intid = setInterval(function(){
                if (!form.destroyed && (form.didChange != form.scale.value + "/" + form.rotateX.value)) {
                    thus._commit(form, true);
                } else {
                    clearInterval(intid);
                    form.allowCommit = true;
                }
            }, 200);
        }
        this._commit(form, form.allowCommit);
        form.allowCommit = false;
    };

    TransformUI.prototype._abort = function(ev) {
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: 'abort',
                event: {
                }
            })
        );
        this._destroy();
    };

    TransformUI.prototype._snap = function(ev) {
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: 'snap',
                event: {
                }
            })
        );
        this._destroy();
    };
    TransformUI.prototype._commit = function(form, commit) {
        var scalearg = form.scale.value - 0;
        if (commit) {
            form.didChange = form.scale.value + "/" + form.rotateX.value;
        }
        var newscale = Math.exp(Math.log((1+scalearg)/(1-scalearg)));
        var newrotate = form.rotateX.value - 0;
        //var value = Math.exp(relative);
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: 'setslider',
                event: {
                    value: newscale,
                    y_radians: newrotate,
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
    TransformUI.prototype._delete_object = function(ev) {
        if (!confirm("Are you sure you want to delete selected?")) {
            return;
        }
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg: 'delete',
                event: {
                }
            })
        );
    };

});
