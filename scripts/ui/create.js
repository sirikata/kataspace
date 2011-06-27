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

        var button_div = $('<button>Create</button>').appendTo($('body'));
        this.button = button_div;
        button_div.button().click(
            Kata.bind(this.create, this)
        );
        parent.addElement($('<input type="text" placeholder="http://example.com/collada.dae" id="objectCreation'+UNIQUE_ID+'" size="40" />'));
        parent.addElement($('<select type="text" placeholder="http://example.com/collada.dae" id="objectDropdown'+UNIQUE_ID+'" size="1" ><option value=""></option><option value="a">Wall</option><option value="aa">Walls</option><option value="aaa">Wall3</option><option value="aaaa">Wall4</option><option value="aad">WDoor</option><option value="d">Door</option><option value="aadaa">wDoorw</option><option value="t">Tent</option><option value="tt">Tents</option><option value="w">Fort</option><option value="W">Gate</option><option value="p">Dias</option><option value="P">Bldg</option><option value="y">LRoof</option><option value="z">URoof</option><option value="m">Market</option></select>'));
        parent.addButton(button_div);
        this.uniqueId=UNIQUE_ID;
        UNIQUE_ID+=1;
        this.parent = parent;
    };
    Kata.extend(CreateUI, SUPER);

    // GUISimulation interface
    CreateUI.prototype.handleGUIMessage = function(evt) {
        if (evt.msg !== 'create') return;
    };


    CreateUI.prototype.create = function() {
        // Send the message
        var thus = this;
        var base;
        var value=document.getElementById('objectCreation'+this.uniqueId).value;
        if (value=="") {
            value=document.getElementById('objectDropdown'+this.uniqueId).value;
        }
        var dirname = window.location.href.substr(0, window.location.href.lastIndexOf('/') + 1);
        function immediateLoad(value,options) {
            thus.mChannel.sendMessage(new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg:'create',
                event: {
                    visual: value+options
                }
            })); /* put args here for what to create */    

        }
        var options=value.indexOf("?");
        if (options>=0){
            options=value.substr(options);
            value=value.substr(0,value.indexOf("?"));
        }else {
            options="";            
        }
        switch (value) {
        case "A":
            return immediateLoad(dirname+ "static/wall/wall.dae",options);
        case "C":
            return immediateLoad(dirname+ "static/wall/corner.dae",options);
        case "c":
            return immediateLoad(dirname+ "static/wall/col.dae",options);
        case "a":
            return immediateLoad(dirname+ "static/wall/colwall.dae",options);
        case "aa":
            return immediateLoad(dirname+ "static/wall/colwallwall.dae",options);
        case "aaa":
            return immediateLoad(dirname+ "static/wall/cornerwallwallwall.dae",options);
        case "aad":
            return immediateLoad(dirname+ "static/wall/cornerwallwalldoor.dae",options);
        case "aaaa":
            return immediateLoad(dirname+ "static/wall/cornerwallwallwallwall.dae",options);
        case "aada":
            return immediateLoad(dirname+ "static/wall/cornerwallwalldoorwall.dae",options);
        case "aaaaa":
            return immediateLoad(dirname+ "static/wall/cornerwallwallwallwallwall.dae",options);
        case "aadaa":
            return immediateLoad(dirname+ "static/wall/cornerwallwalldoorwallwall.dae",options);
        case "d":
            return immediateLoad(dirname+ "static/wall/coldoor.dae",options);
        case "market":
            return immediateLoad(dirname+ "static/market/market.dae",options);                       
        case "m":
            return immediateLoad(dirname+ "static/market/market.dae",options);                       
        case "t":
            return immediateLoad(dirname+ "static/tent/models/Tent.dae",options);
        case "tent":
            return immediateLoad(dirname+ "static/tent/models/Tent.dae",options);                       
        case "tt":
            return immediateLoad(dirname+ "static/tents.dae",options);                  case "tents":
            return immediateLoad(dirname+ "static/tents.dae",options);                       
        case "palace": 
            return immediateLoad(dirname+ "static/palace/models/fc.dae",options);
        case "P": 
            return immediateLoad(dirname+ "static/palace/models/fc.dae",options);           
        case "w":
            return immediateLoad(dirname+ "static/LongerFence/fence.dae",options);
        case "W":
            return immediateLoad(dirname+ "static/GateHouse/house.dae",options);
        case "y":
            return immediateLoad(dirname+ "static/fcroof/roof.dae",options);
        case "z":
            return immediateLoad(dirname+ "static/fcroof/roof_lower.dae",options);
        case "p":
            return immediateLoad(dirname+ "static/fcsquare/square.dae",options);
        }
        var i = value.indexOf("/processed/index.html");
        if (i >= 0) {
            base = value.substr(0, i) + "/processed/";
        }
        else {
            i = value.indexOf("?v=");       /// old skool
            if (i >= 0) {
                var ext;
                var userhash = value.substr(i+3);
                var j = userhash.indexOf(":");
                var hash = userhash.substr(j+1)
                if (j==1) {
                    ext = "/" + hash;
                }
                else {
                    ext = "/" + userhash.substr(0,j) + "/" + hash;
                }
                var temp = value.substr(0, i);
                j = temp.lastIndexOf("/");
                base = temp.substr(0, j) + ext + "/processed/";
            }
        }
        if (i >= 0) {
            value = base + "view.json";
            Kata.warn("DEBUG loading: " + value);
            var req = new XMLHttpRequest();
            if (req) {
                req.onreadystatechange = function(){
                    if (req.readyState == 4) {
                        if (req.status != 200 && req.status != 0) {
                            Kata.warn("Error loading Document: status " + req.status);
                        }
                        else {
                            var view = {};
                            eval("view=" + this.responseText);
                            value = base + view.o3dscene + ".dae";
                            Kata.warn("inserting into scene: " + value);
                            thus.mChannel.sendMessage(new Kata.ScriptProtocol.ToScript.GUIMessage({
                                msg:'create',
                                event: {
                                    visual: value
                                }
                            })); /* put args here for what to create */
                        }
                    }
                };
                req.open("GET", value, true);
                req.send("");
            }
        }
        else {
            if (!value) {
                var dirname2 = window.location.href.substr(0, window.location.href.lastIndexOf('/') + 1);
                value = dirname2 + "static/maleWalkIdleSit.dae";
            }
            this.mChannel.sendMessage(new Kata.ScriptProtocol.ToScript.GUIMessage({
                msg:'create',
                event: {
                    visual: value
                }
            })); /* put args here for what to create */
        }
    };
});
