// Global namespace.
var Example;

Kata.require([
    'katajs/oh/GraphicsScript.js',
    '../../objectscript.js',
// FIXME we want to be able to specify a centralized offset so we
// don't have to have this ../../ stuff here.
    '../../scripts/behavior/chat/Chat.js',
    '../../scripts/behavior/animated/Animated.js'
], function(){
    if (typeof(Example) === "undefined") {
        Example = {};
    }

    var SUPER = Kata.GraphicsScript.prototype;
    Example.BlessedScript = function(channel, args){
        SUPER.constructor.call(this, channel, args, Kata.bind(this.updateRenderState, this));

        this._scale = args.loc.scale;
        this.connect(args, null, Kata.bind(this.connected, this));

        this.keyIsDown = {};

        this.sitting = false;

        this.mSelected = {};
        this.mDrag = null;

        this.mChatBehavior =
            new Kata.Behavior.Chat(
                args.name, this,
                Kata.bind(this.chatEnterEvent, this),
                Kata.bind(this.chatExitEvent, this),
                Kata.bind(this.chatMessageEvent, this)
            );
        this.mAnimatedBehavior =
            new Kata.Behavior.Animated(
                this,
                {
                    idle: 'idle',
                    forward: 'walk'
                },
                Kata.bind(this.animatedSetState, this)
            );
    };
    Kata.extend(Example.BlessedScript, SUPER);

    Example.BlessedScript.prototype.createChatEvent = function(action, name, msg) {
        var evt = {
            action : action,
            name : name
        };
        if (msg)
            evt.msg = msg;
        return new Kata.ScriptProtocol.FromScript.GUIMessage("chat", evt);
    };
    Example.BlessedScript.prototype.chatEnterEvent = function(remote, name) {
        this._sendHostedObjectMessage(this.createChatEvent('enter', name));
        var remote_pres = this.getRemotePresence(remote);
        if (remote_pres) this.updateGFX(remote_pres);
    };
    Example.BlessedScript.prototype.chatExitEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('exit', name, msg));
    };
    Example.BlessedScript.prototype.chatMessageEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('say', name, msg));
    };


    Example.BlessedScript.prototype.animatedSetState = function(remote, state) {
        remote._animatedState = state;
        this.updateGFX(remote);
    };

    Example.BlessedScript.prototype.handleChatGUIMessage = function(msg) {
        var revt = msg.event;
        this.mChatBehavior.chat(revt);
    };

    Example.BlessedScript.prototype.updateSittingAnimation = function() {
        var new_state = {
            idle: (this.sitting ? 'sit' : 'idle'),
            forward: 'walk'
        };
        this.mPresence._animatedState = new_state;
        this.mAnimatedBehavior.setState(new_state);
    };

    Example.BlessedScript.prototype.disableSitting = function() {
        this.sitting = false;
        // Notify the GUI so it can reset the button
        var evt = { sitting: false };
        var msg = new Kata.ScriptProtocol.FromScript.GUIMessage("sit", evt);
        this._sendHostedObjectMessage(msg);
        this.updateSittingAnimation();
    };

    Example.BlessedScript.prototype.handleSitGUIMessage = function(msg) {
        this.sitting = !this.sitting;
        this.updateSittingAnimation();
    };


    Example.BlessedScript.prototype.proxEvent = function(remote, added){
        if (added) {
            Kata.warn("Camera Discover object.");
            this.mPresence.subscribe(remote.id());
            this.mOther = remote;
        }
        else {
            Kata.warn("Camera Wiped object.");      // FIXME: unsubscribe!
        }
    };
    Example.BlessedScript.prototype.setRemoteObjectLocation = function (presence, remoteId, location) {
        var payload=JSON.stringify(location);
        console.log("SENDING PACKET WITH DATA "+payload+" to "+JSON.stringify(remoteId.object()));
        var sendPort = presence.bindODPPort(Example.ObjectScript.kMovePort+1);
        sendPort.send(new Kata.ODP.Endpoint(remoteId, Example.ObjectScript.kMovePort),payload);
        sendPort.close();
    };

    Example.BlessedScript.prototype.connected = function(presence, space, reason) {
        if (!presence) {
            // If we failed to connect, notify the user
            var evt = { status : 'failed', reason : reason };
            var msg = new Kata.ScriptProtocol.FromScript.GUIMessage("connection", evt);
            this._sendHostedObjectMessage(msg);
            Kata.warn("connection failure");
            return;
        }

        // NOTE: Not the same as this.mPresences.
        // The one Presence to rule them all!
        // In a perfect world, we shouldn't ever use this.
        this.mPresence = presence;

        this.enableGraphicsViewport(presence, 0);
        presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        presence.setQuery(0);

        // Select random offset from origin so people don't land on each other
        var xoff = ((Math.random() - 0.5) * 2.0) * 5.0;
        var zoff = ((Math.random() - 0.5) * 2.0) * 5.0;
        // Radius of avatars is about 2.5, with height about 4.33 ->
        // normalized to radius 1 and height about 1.7. Shift by about
        // .85 (1.7/2) instead of full scale. Would be nice to have a
        // reliable, non-magic-numbers approach for this.
        presence.setPosition([xoff, this._scale[1] * 1.0, zoff]);
        this.setCameraPosOrient(this._calcCamPos(), [0,0,0,1], 0.0);
        // FIXME both this and the camera controls in GraphicsScript
        // are running on timers because the ones in GraphicsScript
        // don't accept velocity
        this.mCamUpdateTimer = setInterval(Kata.bind(this.updateCamera, this), 60);
        Kata.warn("Got connected callback.");
    };

    Example.BlessedScript.prototype.presenceInvalidated = function(presence, reason) {
        SUPER.presenceInvalidated.call(this, presence, reason);
        // Notify the GUI so it can present an error message
        var evt = { reason : reason };
        var msg = new Kata.ScriptProtocol.FromScript.GUIMessage("disconnected", evt);
        this._sendHostedObjectMessage(msg);
    };

    Example.BlessedScript.prototype.updateCamera = function() {
        this.setCameraPosOrient(this._calcCamPos(), this._calcCamOrient(), 0.90);
    };

    Example.BlessedScript.prototype.Keys = {
        UP : 38,
        DOWN : 40,
        LEFT : 37,
        RIGHT : 39,
        ESCAPE : 27
    };
    Example.BlessedScript.prototype.handleCreateObject = function (objectName, pos, orient) {
            this.createObject("../../objectscript.js", "Example.ObjectScript", {
                                  space: this.mPresence.mSpace,
                                  name: "Created object "+objectName,
                                  loc: {
                                      scale: [1,1,1],
                                      pos: pos ? pos : this.mPresence.predictedPosition(Kata.now(this.mPresence.mSpace)),
                                      orient : orient
                                  },
                                  creator: this.mPresence.id(),
                                  visual: {mesh:objectName},
                                  auth: "whiskey-foxtrot-tango"
                                  //,port: port
                                  //,receipt: ""+idx
            });
         
    };

    Example.BlessedScript.prototype.clearSelection = function(space) {
        for (var id in this.mSelected) {
            var sendmsg;
            sendmsg = new Kata.ScriptProtocol.FromScript.GFXHighlight(space, id, false);
            this._sendHostedObjectMessage(sendmsg);
        }
        this.mSelected = {};
    };
    Example.BlessedScript.prototype.addSelection = function(space, id) {
        this.mSelected[id] = true;
        var sendmsg;
        sendmsg = new Kata.ScriptProtocol.FromScript.GFXHighlight(space, id, true);
        this._sendHostedObjectMessage(sendmsg);
    };
    Example.BlessedScript.prototype.removeSelection = function(space, id) {
        delete this.mSelected[id];
        var sendmsg;
        sendmsg = new Kata.ScriptProtocol.FromScript.GFXHighlight(space, id, false);
        this._sendHostedObjectMessage(sendmsg);
    };
    Example.BlessedScript.prototype.foreachSelected = function(space, func) {
        for (var obj in this.mSelected) {
            var presid = new Kata.PresenceID(space, obj);
            func.call(this, presid);
        }
    };

    Example.BlessedScript.prototype.resetDrag = function() {
        if (this.mDrag) {
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (remote_pres) {
                    var time = Kata.now(remote_pres.mSpace);
                    var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                    if (this.mDrag.initialScale && presid in this.mDrag.initialScale) {
                        newLoc.scale = this.mDrag.initialScale[presid];
                        newLoc.scaleTime = time;
                        remote_pres.mLocation.scale = newLoc.scale;
                        remote_pres.mLocation.scaleTime = time;
                    }
                    if (this.mDrag.initialOrient && presid in this.mDrag.initialOrient) {
                        newLoc.orient = this.mDrag.initialOrient[presid];
                        newLoc.orientTime = time;
                        remote_pres.mLocation.orient = newLoc.orient;
                        remote_pres.mLocation.orientTime = time;
                    }
                    var msg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                        remote_pres.space(),
                        remote_pres.id(),
                        remote_pres,
                        { loc : newLoc }
                    );
                    console.log("Abort drag", newLoc, msg);
                    this._sendHostedObjectMessage(msg);
                    this.setRemoteObjectLocation(this.mPresence,
                                                 remote_pres,
                                                 newLoc);
                }
            });
            this.mDrag = null;
        }
    };

    Example.BlessedScript.prototype._handleGUIMessage = function (channel, msg) {
        Kata.GraphicsScript.prototype._handleGUIMessage.call(this,channel,msg);
        if (msg.msg == 'chat') {
            this.handleChatGUIMessage(msg);
        }
        if (msg.msg == 'create') {
            Kata.log("Creating object with visual "+msg.event.visual+" orient "+msg.event.orient);
            this.handleCreateObject(msg.event.visual, msg.event.pos, msg.event.orient);
        }
        if (msg.msg == 'sit') {
            this.handleSitGUIMessage(msg);
        }
        if (msg.msg == "mousedown") {
        }
        if (msg.msg == "mouseup") {
        }
        if (msg.msg == "abort") {
            this.resetDrag();
        }
        if (msg.msg == "setscale") {
            this.mDrag = this.mDrag || {};
            var deltaScale = msg.event.value;
            Kata.log("Setting scale to "+deltaScale);
            if (!this.mDrag.scaling) {
                this.mDrag.scaling = true;
                this.mDrag.initialScale = {};
                this.foreachSelected(this.mPresence.mSpace, function(presid) {
                    var remote_pres = this.getRemotePresence(presid);
                    if (remote_pres) {
                        var time = Kata.now(remote_pres.mSpace);
                        this.mDrag.initialScale[presid] = remote_pres.scale(time);
                    }
                });
            }
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (presid in this.mDrag.initialScale && remote_pres) {
                    var time = Kata.now(remote_pres.mSpace);
                    var oldScale = this.mDrag.initialScale[presid];
                    var newScale = [oldScale[0] * deltaScale, oldScale[1] * deltaScale, oldScale[2] * deltaScale];
                    var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                    newLoc.scale = newScale;
                    newLoc.scaleTime = time;
                    var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                        remote_pres.space(),
                        remote_pres.id(),
                        remote_pres,
                        { loc : newLoc }
                    );
                    this._sendHostedObjectMessage(gfxmsg);
                    if (msg.event.commit) {
                        // Make change permanent!
                        remote_pres.mLocation.scale = newScale;
                        remote_pres.mLocation.scaleTime = time;
                        this.setRemoteObjectLocation(this.mPresence,
                                                     remote_pres,
                                                     newLoc);
                    }
                    remote_pres._updateLoc({scale: newScale, time: time + 5000});
                }
            });
        }
        if (msg.msg == "setrotation") {
            this.mDrag = this.mDrag || {};
            var y_radians = msg.event.y_radians;
            Kata.log("Setting rotation to "+y_radians);
            if (!this.mDrag.rotating) {
                this.mDrag.rotating = true;
                this.mDrag.initialOrient = {};
                this.foreachSelected(this.mPresence.mSpace, function(presid) {
                    var remote_pres = this.getRemotePresence(presid);
                    if (remote_pres) {
                        var time = Kata.now(remote_pres.mSpace);
                        this.mDrag.initialOrient[presid] = remote_pres.orientation(time);
                    }
                });
            }
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (presid in this.mDrag.initialOrient && remote_pres) {
                    var time = Kata.now(remote_pres.mSpace);
                    var oldQuat = this.mDrag.initialOrient[presid];
                    var newQuat = Kata.extrapolateQuaternion(oldQuat, y_radians, [0,1,0], 1.0);
                    var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                    newLoc.orient = newQuat;
                    newLoc.orientTime = time;
                    var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                        remote_pres.space(),
                        remote_pres.id(),
                        remote_pres,
                        { loc : newLoc }
                    );
                    this._sendHostedObjectMessage(gfxmsg);
                    if (msg.event.commit) {
                        // Make change permanent!
                        remote_pres.mLocation.orient = newQuat;
                        remote_pres.mLocation.orientTime = time;
                        this.setRemoteObjectLocation(this.mPresence,
                                                     remote_pres,
                                                     newLoc);
                    }
                    remote_pres._updateLoc({orient: newQuat, time: time + 5000});
                }
            });
        }
        if (msg.msg == "pick") {
            this.mDrag = null; //this.resetDrag();
            if (!(msg.shiftKey || msg.metaKey)) {
                if (!(msg.id && msg.id in this.mSelected)) {
                    this.clearSelection(msg.spaceid);
                }
            }
            if (msg.id) {
                if (msg.id in this.mSelected) {
                    if (msg.metaKey) {
                        this.removeSelection(msg.spaceid, msg.id);
                    }
                } else {
                    this.addSelection(msg.spaceid, msg.id);
                }
            }
            var gfxmsg = new Kata.ScriptProtocol.FromScript.GUIMessage("transform", {action: "hide"});
            this._sendHostedObjectMessage(gfxmsg);

            var dx = (msg.pos[0] - msg.camerapos[0]);
            var dy = (msg.pos[1] - msg.camerapos[1]);
            var dz = (msg.pos[2] - msg.camerapos[2]);
            var length = Math.sqrt(dx*dx + dy*dy + dz*dz);
            var camdir = msg.cameradir;
            if (msg.ctrlKey) {
                camdir = [0,-1,0];
            }
            var planedist = dx*camdir[0] + dy*camdir[1] + dz*camdir[2];
            //if (planedist > 0) {
                this.mDrag = {camerapos: msg.camerapos, ctrlKey: msg.ctrlKey, dir: msg.dir, planedist: planedist, start: msg.pos, dist:length};
            //}
        }
        if ((msg.msg == "drag" || msg.msg == "drop") && this.mDrag) {
            var camdir = msg.cameradir;
            if (this.mDrag.ctrlKey) {
                camdir = [0,-1,0];
            }
            var length = this.mDrag.planedist / (msg.dir[0]*camdir[0] +
                                              msg.dir[1]*camdir[1] +
                                              msg.dir[2]*camdir[2]);
            var cam = msg.camerapos;
            var end = [msg.dir[0] * length + cam[0], msg.dir[1] * length + cam[1], msg.dir[2] * length + cam[2]];
            var start = this.mDrag.start;
            var deltaPos = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
            var deltaPosLen = Math.sqrt(deltaPos[0]*deltaPos[0]+
                deltaPos[1]*deltaPos[1]+deltaPos[2]*deltaPos[2]);
            var test = (camdir[0])*msg.dir[0] + (camdir[1])*msg.dir[1] + (camdir[2])*msg.dir[2];
            if (this.mDrag.ctrlKey && (deltaPosLen > 20 || !(test <= 0))) {
                if (test > 0) deltaPosLen = -deltaPosLen;
                for (var i = 0; i < 3; i++) {
                    deltaPos[i] = deltaPos[i]*20/deltaPosLen;
                }
            }
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (remote_pres) {
                    var time = Kata.now(remote_pres.mSpace);
                    var oldPos = remote_pres.position(time);
                    var newPos = [oldPos[0] + deltaPos[0], oldPos[1] + deltaPos[1], oldPos[2] + deltaPos[2]];
                    var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                    newLoc.pos = newPos;
                    var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                        remote_pres.space(),
                        remote_pres.id(),
                        remote_pres,
                        { loc : newLoc }
                    );
                    this._sendHostedObjectMessage(gfxmsg);
                    if (msg.msg == "drop") {
                        this.setRemoteObjectLocation(this.mPresence,
                                                     remote_pres,
                                                     newLoc);
                        // Make change permanent!
                    }
                }
            });
        }
        if (msg.msg == "drop" || msg.msg == "click") {
            this.mDrag = null;
            for (var id in this.mSelected) {
                // if nonempty...
                var gfxmsg = new Kata.ScriptProtocol.FromScript.GUIMessage("transform", {action: "show", x: msg.clientX, y: msg.clientY});
                this._sendHostedObjectMessage(gfxmsg);
                break;
            }
        }
        if (msg.msg == "keyup") {
            this.keyIsDown[msg.keyCode] = false;

            if ( !this.keyIsDown[this.Keys.UP] && !this.keyIsDown[this.Keys.DOWN])
                this.mPresence.setVelocity([0, 0, 0]);
            if ( !this.keyIsDown[this.Keys.LEFT] && !this.keyIsDown[this.Keys.RIGHT])
                this.mPresence.setAngularVelocity(Kata.Quaternion.identity());
        }

        if (msg.msg == "keydown") {
            var avMat = Kata.QuaternionToRotation(this.mPresence.predictedOrientation(new Date()));
            var avSpeed = 1;
            var avXX = avMat[0][0] * avSpeed;
            var avXY = avMat[0][1] * avSpeed;
            var avXZ = avMat[0][2] * avSpeed;
            var avZX = avMat[2][0] * avSpeed;
            var avZY = avMat[2][1] * avSpeed;
            var avZZ = avMat[2][2] * avSpeed;
            this.keyIsDown[msg.keyCode] = true;

            if (this.keyIsDown[this.Keys.ESCAPE]) {
                this.resetDrag();
            }
            if (this.keyIsDown[this.Keys.UP]) {
                this.mPresence.setVelocity([-avZX, -avZY, -avZZ]);
                this.disableSitting();
            }
            if (this.keyIsDown[this.Keys.DOWN]) {
                this.mPresence.setVelocity([avZX, avZY, avZZ]);
            }
            var full_rot_seconds = 10.0;
            if (this.keyIsDown[this.Keys.LEFT]) {
                this.mPresence.setAngularVelocity(
                    Kata.Quaternion.fromAxisAngle([0, 1, 0], 2.0*Math.PI/full_rot_seconds)
                );
                this.disableSitting();
            }
            if (this.keyIsDown[this.Keys.RIGHT]) {
                this.mPresence.setAngularVelocity(
                    Kata.Quaternion.fromAxisAngle([0, 1, 0], -2.0*Math.PI/full_rot_seconds)
                );
                this.disableSitting();
            }
        }

        // We could be more selective about this, making sure we
        // actually made a change, but this is safe: always push an
        // update to the GFX system for our info.
        this.updateGFX(this.mPresence);
    };

    Example.BlessedScript.prototype.updateRenderState = function(presence, remote) {
        this.updateLabel(presence, remote);
        this.updateAnimation(presence, remote);
    };

    Example.BlessedScript.prototype._getVerticalOffset = function(remote) {
        // FIXME there should be a better way of deciding this
        return (remote._animatedState && (remote._animatedState.idle == 'sit')) ? 0 : 1;
    };
    Example.BlessedScript.prototype._getHorizontalOffset = function() {
        return 3;
    };

    Example.BlessedScript.prototype.updateLabel = function(presence, remote) {
        if (presence.id() == remote.id()) return;
        var name = this.mChatBehavior.getName(remote);
        if (!name) return;
        var vert_off = this._getVerticalOffset(remote) + .25;
        if (!remote._lastLabel || remote._lastLabel != name || remote._lastLabelOffset != vert_off) {
            this.setLabel(
                presence, remote.presenceID(), name,
                [0, vert_off, 0]
            );
            remote._lastLabel = name;
            remote._lastLabelOffset = vert_off;
        }
    };

    Example.BlessedScript.prototype.updateAnimation = function(presence, remote){
        var vel = remote.predictedVelocity();
        var angspeed = remote.predictedAngularSpeed();
        var is_mobile = (vel[0] != 0 || vel[1] != 0 || vel[2] != 0 || angspeed != 0);
        
        var cur_anim = remote.cur_anim;
        var cur_state = remote._animatedState;
        if (cur_state === undefined)
            cur_state = {
                idle: 'idle',
                forward: 'walk'
            };
        var new_anim = (is_mobile ? cur_state.forward : cur_state.idle);

        if (cur_anim != new_anim) {
            this.animate(presence, remote, new_anim);
            remote.cur_anim = new_anim;
        }
    };
    Example.BlessedScript.prototype._calcCamPos = function() {
        var orient = new Kata.Quaternion(this._calcCamOrient());
        var pos = this.mPresence.predictedPosition(new Date());
        var offset = [0, this._getVerticalOffset(this.mPresence), this._getHorizontalOffset()];
        var oriented_offset = orient.multiply(offset);
        return [pos[0] + oriented_offset[0],
                pos[1] + oriented_offset[1],
                pos[2] + oriented_offset[2]];
    };
    Example.BlessedScript.prototype._calcCamOrient = function(){
        return this.mPresence.predictedOrientation(new Date());
    };
}, '../../scripts/BlessedScript.js');
