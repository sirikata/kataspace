/*  Kata Javascript Utilities
 *  Animated.js
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
    ['externals/protojs/protobuf.js','externals/protojs/pbj.js','../../scripts/behavior/animated/Animated.pbj.js']
], function() {

    if (typeof(Kata.Behavior) == "undefined")
        Kata.Behavior = {};

    /** Animated maintains animation states.  Currently it just
     *  tracks and idle and a moving state.
     *
     *  @constructor
     *  @param parent {Kata.Script} the parent Script for this behavior
     *  @param init_state {Object} map of initial states.
     *  @param update_cb {function(Kata.RemotePresence, Object)}
     *  callback invoked when an update is received from the another object.
     *  Second parameter is a map of state animations, e.g.
     *  { idle : 'sit', forward : 'walk' }.
     */
    Kata.Behavior.Animated = function(parent, init_state, update_cb) {
        this.mParent = parent;
        this.mParent.addBehavior(this);

        this.mPorts = {};

        this.mUpdateCallback = update_cb;

        this.mTrackedObjects = {};

        this.mLastState = init_state;
    };

    Kata.Behavior.Animated.prototype.ProtocolPort = 12;

    Kata.Behavior.Animated.prototype.setState = function(state) {
        this.mLastState = state;
        this._sendUpdate(state);
    };

    Kata.Behavior.Animated.prototype._serializeMessage = function(msg) {
        var serialized = new PROTO.ByteArrayStream();
        msg.SerializeToStream(serialized);
        return serialized.getArray();
    };

    Kata.Behavior.Animated.prototype._getPort = function(pres) {
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

    Kata.Behavior.Animated.prototype._handleEnter = function(presence, remoteID) {
        if (this.mTrackedObjects[remoteID]) {
            Kata.warn("Overwriting existing animated info due to duplicate intro.");
        }
        this.mTrackedObjects[remoteID] = {
            presence : presence,
            dest : new Kata.ODP.Endpoint(remoteID, this.ProtocolPort)
        };
        // Always send an initial update
        this._sendUpdate(this.mLastState);
    };

    Kata.Behavior.Animated.prototype._handleSetStateMessage = function(remoteID, msg) {
        if (this.mTrackedObjects[remoteID]) {
            var objdata = this.mTrackedObjects[remoteID];
            this.mUpdateCallback( this.mParent.getRemotePresence(remoteID), msg);
        }
    };

    Kata.Behavior.Animated.prototype._handleExit = function(remoteID, msg) {
        if (this.mTrackedObjects[remoteID]) {
            var objdata = this.mTrackedObjects[remoteID];
            delete this.mTrackedObjects[remoteID];
        }
    };

    Kata.Behavior.Animated.prototype.newPresence = function(pres) {
        // When we get a presence, we just set up a listener for
        // messages. The rest is triggered by prox events.
        var odp_port = this._getPort(pres);
    };

    Kata.Behavior.Animated.prototype.presenceInvalidated = function(pres) {
        var odp_port = this._getPort(pres);
        if (odp_port) {
            odp_port.close();
            delete this.mPorts[pres.presenceID()];
        }
    };

    Kata.Behavior.Animated.prototype.remotePresence = function(presence, remote, added) {
        if (added) {
            // This protocol is active: when we detect another presence,
            // we try to send it an intro message. This message subscribes us for updates.
            var intro_msg = new Animated.Protocol.Intro();
            var container_msg = new Animated.Protocol.Container();
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

    Kata.Behavior.Animated.prototype._sendUpdate = function(state) {
        // Simply iterate over everyone we know about and try to get the message to them.
        for(var remote_key in this.mTrackedObjects) {
            var animate_msg = new Animated.Protocol.SetState();
            animate_msg.idle = state.idle;
            animate_msg.forward = state.forward;
            var container_msg = new Animated.Protocol.Container();
            container_msg.state = animate_msg;

            var objdata = this.mTrackedObjects[remote_key];
            var odp_port = this._getPort(objdata.presence);
            odp_port.send(objdata.dest, this._serializeMessage(container_msg));
        }
    };

    Kata.Behavior.Animated.prototype._handleMessage = function(presence, src, dest, payload) {
        // We should be able to just parse a Animated Container
        var container_msg = new Animated.Protocol.Container();
        container_msg.ParseFromStream(PROTO.CreateArrayStream(payload));

        // And just try handling any and all of the three components
        if (container_msg.HasField("intro")) {
            this._handleEnter(presence, src.presenceID());
        }

        if (container_msg.HasField("state")) {
            this._handleSetStateMessage(src.presenceID(), container_msg.state);
        }
    };

}, '../../scripts/behavior/animated/Animated.js');
