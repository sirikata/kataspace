/*  KataSpace
 *  importexport.js
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
    /** Tracks session events, presenting an error message if on disconnection. */
    ExportUI = function(channel, parent) {
        SUPER.constructor.call(this, channel);

        var export_div = $('<button>Export</button>').appendTo($('body'));
        this.button = export_div;
        export_div.button().click(
            Kata.bind(this.doExport, this)
        );
        var import_div = $('<button>Import</button>').appendTo($('body'));
        this.button = import_div;
        import_div.button().click(
            Kata.bind(this.doImport, this)
        );
        parent.addButton(import_div);
        parent.addButton(export_div);
        this.parent = parent;
    };
    Kata.extend(ExportUI, SUPER);

    // GUISimulation interface
    ExportUI.prototype.handleGUIMessage = function(evt) {
        if (evt.msg == 'scenedump') {
            this.displaySceneDump(evt.event.serialized);
        }
    };


    ExportUI.prototype.displaySceneDump = function(serialized) {
        console.log(serialized);
        var json = JSON.stringify(serialized);
        window.open("data:application/json,"+json, "_blank");
    };
    ExportUI.prototype.doExport = function() {
        // Send the message
        var thus = this;
        var base;
        thus.mChannel.sendMessage(
            new Kata.ScriptProtocol.ToScript.GUIMessage(
                {
                    msg:'export',
                    event: {}
                }));
    };
    ExportUI.prototype.doImport = function() {
        // Send the message
        var thus = this;
        var data = prompt("Paste Data or URL", "http://sbox.ourbricks.com/mcdemo/kataspace.git/static/save.txt");
        var json = null;
        if (data) {
            try {
                json = JSON.parse(data);
            } catch (x) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", data, false);
                xhr.send(null);
                if (xhr.status == 200 || xhr.status == 0) {
                    data = xhr.responseText;
                    try {
                        json = JSON.parse(data);
                    } catch (x) {
                    }
                }
            }
        }
        if (!json) {
            alert("Could not parse. Check your URL or json formatting");
        } else {
            var base;
            thus.mChannel.sendMessage(
                new Kata.ScriptProtocol.ToScript.GUIMessage(
                    {
                        msg:'import',
                        event: {
                            serialized: json
                        }
                    }));
        }
    };
});
