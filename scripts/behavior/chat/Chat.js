/*  Kata Javascript Utilities
 *  Chat.js
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

// We use protocol buffers just to encode the string, we could also
// setup real messages
// FIXME we shouldn't have to specify ../../
Kata.require([
    ['externals/protojs/protobuf.js','externals/protojs/pbj.js','../../scripts/behavior/chat/Chat.pbj.js']
], function() {

    if (typeof(Kata.Behavior) == "undefined")
        Kata.Behavior = {};

    /** Chat is a simple behavior which can send and receive chat
     *  messages.  Chat groups are discovered through normal queries
     *  -- we just piggy back on the results already being returned
     *  for the objects. Other chat-enabled objects are discovered and
     *  tracked. Messages are broadcast to all other chat-enabled
     *  objects we are aware of.
     *
     *  The core interface, after initial setup, is a method chat()
     *  for sending chat messages. Callbacks can also be registered
     *  for notification of other chat-enabled objects,
     *
     *  @constructor
     *  @param name {String} the name for this object
     *  @param parent {Kata.Script} the parent Script for this behavior
     *  @param enter_cb {function(Kata.RemotePresence, String)}
     *  callback invoked when a new chat-enabled object enters range,
     *  giving its name
     *  @param exit_cb {function(Kata.RemotePresence, String, String)}
     *  callback invoked when a new chat-enabled object exits range,
     *  giving its name and possibly an exit message.
     *  @param msg_cb {function(Kata.RemotePresence, String, String)}
     *  callback invoked when a chat message is received, giving the
     *  name of the object and the message.
     */
    Kata.Behavior.Chat = function(name, parent, enter_cb, exit_cb, msg_cb) {
        this.mName = name;

        this.mParent = parent;
        this.mParent.addBehavior(this);

        this.mPorts = {};

        this.mEnterCallback = enter_cb;
        this.mExitCallback = exit_cb;
        this.mMessageCallback = msg_cb;

        this.mTrackedObjects = {};
    };

    Kata.Behavior.Chat.prototype.ProtocolPort = 11;

    /** The primary interface for the chat behavior. Requests that the
     *  message be broadcast to other users.
     */
    Kata.Behavior.Chat.prototype.chat = function(msg) {
        // Simply iterate over everyone we know about and try to get the message to them.
        for(var remote_key in this.mTrackedObjects) {
            var chat_msg = new Chat.Protocol.Chat();
            chat_msg.text = msg;
            var container_msg = new Chat.Protocol.Container();
            container_msg.chat = chat_msg;

            var objdata = this.mTrackedObjects[remote_key];
            var odp_port = this._getPort(objdata.presence);
            odp_port.send(objdata.dest, this._serializeMessage(container_msg));
        }
    };

    Kata.Behavior.Chat.prototype._serializeMessage = function(msg) {
        var serialized = new PROTO.ByteArrayStream();
        msg.SerializeToStream(serialized);
        return serialized.getArray();
    };

    Kata.Behavior.Chat.prototype._getPort = function(pres) {
        var id = pres;
        if (pres.presenceID)
            id = pres.presenceID();
        var odp_port = this.mPorts[id];
        if (!odp_port && pres.bindODPPort) {
            odp_port = pres.bindODPPort(this.ProtocolPort);
            odp_port.receive(Kata.bind(this._handleMessage, this, pres));
            this.mPorts[id] = odp_port;
        }
        return odp_port;
    };

    Kata.Behavior.Chat.prototype._handleEnter = function(presence, remoteID, name) {
        if (this.mTrackedObjects[remoteID]) {
            Kata.warn("Overwriting existing chat info due to duplicate intro.");
        }
        this.mTrackedObjects[remoteID] = {
            name : name,
            presence : presence,
            dest : new Kata.ODP.Endpoint(remoteID, this.ProtocolPort)
        };
        this.mEnterCallback(remoteID, name);
    };

    Kata.Behavior.Chat.prototype._handleChatMessage = function(remoteID, msg) {
        if (this.mTrackedObjects[remoteID]) {
            var objdata = this.mTrackedObjects[remoteID];
            this.mMessageCallback(remoteID, objdata.name, msg);
        }
    };

    Kata.Behavior.Chat.prototype._handleExit = function(remoteID, msg) {
        if (this.mTrackedObjects[remoteID]) {
            var objdata = this.mTrackedObjects[remoteID];
            delete this.mTrackedObjects[remoteID];
            this.mExitCallback(remoteID, objdata.name, msg);
        }
    };

    Kata.Behavior.Chat.prototype.newPresence = function(pres) {
        // When we get a presence, we just set up a listener for
        // messages. The rest is triggered by prox events.
        var odp_port = this._getPort(pres);
    };

    Kata.Behavior.Chat.prototype.presenceInvalidated = function(pres) {
        var odp_port = this._getPort(pres);
        if (odp_port) {
            odp_port.close();
            delete this.mPorts[pres.presenceID()];
        }
    };

    Kata.Behavior.Chat.prototype.remotePresence = function(presence, remote, added) {
        if (added) {
            // This protocol is active: when we detect another presence,
            // we try to send it an intro message.

            var intro_msg = new Chat.Protocol.Intro();
            intro_msg.name = this.mName;
            var container_msg = new Chat.Protocol.Container();
            container_msg.intro = intro_msg;

            var odp_port = this._getPort(presence);
            odp_port.send(remote.endpoint(this.ProtocolPort), this._serializeMessage(container_msg));
        }
        else {
            // When we lose objects, we just make sure we clean up
            // after ourselves
            this._handleExit(remote.presenceID());
        }
    };

    Kata.Behavior.Chat.prototype._handleMessage = function(presence, src, dest, payload) {
        // We should be able to just parse a Chat Container
        var container_msg = new Chat.Protocol.Container();
        container_msg.ParseFromStream(new PROTO.ByteArrayStream(payload));

        // And just try handling any and all of the three components
        if (container_msg.HasField("intro")) {
            this._handleEnter(presence, src.presenceID(), container_msg.intro.name);
        }

        if (container_msg.HasField("chat")) {
            this._handleChatMessage(src.presenceID(), container_msg.chat.text);
        }

        if (container_msg.HasField("exit")) {
            this._handleExit(src.presenceID(), container_msg.exit.text);
        }
    };

}, '../../scripts/behavior/chat/Chat.js');
