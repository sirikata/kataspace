/*  KataSpace
 *  create.js
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
    var UNIQUE_ID=10;
    /** Tracks session events, presenting an error message if on disconnection. */
    CreateUI = function(channel, parent) {
        SUPER.constructor.call(this, channel);

        var button_div = $('<div>Create</div>').appendTo($('body'));
        this.button = button_div;
        button_div.button().click(
            Kata.bind(this.toggleCreate, this)
        );
        parent.addButton(button_div);
        parent.addButton($('<textarea id="objectCreation'+UNIQUE_ID+'" cols="40" rows="2"/>'));
        this.uniqueId=UNIQUE_ID;
        UNIQUE_ID+=1;
        this.parent = parent;
    };
    Kata.extend(CreateUI, SUPER);

    // GUISimulation interface
    CreateUI.prototype.handleGUIMessage = function(evt) {
        if (evt.msg !== 'create') return;
    };


    CreateUI.prototype.toggleCreate = function() {
        // Send the message
        var value=document.getElementById('objectCreation'+this.uniqueId).value;
        var dirname = window.location.href.substr(0,
                                                  window.location.href.lastIndexOf('/')+1);

        if (!value)
            value=dirname+"static/maleWalkIdleSit.dae";
        this.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage(
                'create',
                {visual:value}//put args here for what to create
            )
        );
    };
});
