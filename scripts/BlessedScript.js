// Global namespace.
var Example;

Kata.require([
    'katajs/oh/GraphicsScript.js',
    '../../objectscript.js',
    'katajs/core/Quaternion.js',
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
        this.panorama=false;
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


    Example.BlessedScript.prototype.handlePanoramaGUIMessage = function(msg) {
        console.log("Panorama");
        this.panorama = !this.panorama;
        this.updateCamera();
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
        //console.log("SENDING PACKET WITH DATA "+payload+" to "+JSON.stringify(remoteId.object()));
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
        presence.setPosition([xoff, 0, zoff]);

        // Select random offset from origin so people don't land on each other
        var xoff = ((Math.random() - 0.5) * 2.0) * 5.0;
        var zoff = ((Math.random() - 0.5) * 2.0) * 5.0;
        // Radius of avatars is about 2.5, with height about 4.33 ->
        // normalized to radius 1 and height about 1.7. Shift by about
        // .85 (1.7/2) instead of full scale. Would be nice to have a
        // reliable, non-magic-numbers approach for this.
        presence.setPosition([xoff, 0, zoff]);
        this.setCameraPosOrient(this._calcCamPos(), [0,0,0,1], 0.0);
        // FIXME both this and the camera controls in GraphicsScript
        // are running on timers because the ones in GraphicsScript
        // don't accept velocity
        this.queryMeshAspectRatio(presence,presence);
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
        ESCAPE : 27,
        W : 87,
        A : 64,
        S : 83,
        D : 68

    };
    Example.BlessedScript.prototype.handleCreateObject = function (objectName, pos, orient, scale) {
            this.createObject("../../objectscript.js", "Example.ObjectScript", {
                                  space: this.mPresence.mSpace,
                                  name: "Created object "+objectName,
                                  loc: {
                                      scale: scale? scale: this._scale,
                                      pos: pos ? pos : this.mPresence.predictedPosition(Kata.now(this.mPresence.mSpace)),
                                      orient : orient
                                  },
                                  creator: this.mPresence.id(),
                                  visual: objectName,
                                  auth: "whiskey-foxtrot-tango"
                                  //,port: port
                                  //,receipt: ""+idx
            });
         
    };

    Example.BlessedScript.prototype.makePhysicsData = function(event) {
        // Source: sirikata/libproxyobject/plugins/ogre/data/scripting/physics.js
        var mass = 1.0;
        var treatment = "ignore"; // "ignore", "static", "dynamic"
        var bounds = "sphere"; // "sphere", "box", "triangles"

        if (event.type in {"static":0, "dynamic":0, "ignore":0}) {
            treatment = event.type;
        }
        if ((mass - 0.0) > 0.0) {
            mass = (mass - 0.0);
        }

        var obj = {mass: mass, treatment: treatment, bounds: bounds};
        var json = JSON.stringify(obj); // Warning: no unicode.
        var bytes = [];
        for (var i = 0; i < json.length; i++) {
            bytes[i] = json.charCodeAt(i);
        }
        return bytes;
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
        if (id == this.mPresence.id()) {
            return;
        }
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
    Example.BlessedScript.prototype.numSelected = function(space) {
        var num = 0;
        for (var obj in this.mSelected) {
            num++;
        }
        return num;
    };
    Example.BlessedScript.prototype.snapToGrid = function() {
        this.foreachSelected(this.mPresence.mSpace, function(presid) {
                                 var remote_pres = this.getRemotePresence(presid);
                                 if (remote_pres) {
                                     Kata.warn("snapped on "+JSON.stringify(remote_pres.visual()));
                                 }
                                 
                             });
    };
    Example.BlessedScript.prototype.resetDrag = function() {
        if (this.mDrag) {
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (remote_pres) {
                    var time = Kata.now(remote_pres.mSpace);
                    var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                    var gfxLoc = {};
                    if (this.mDrag.initialScale && presid in this.mDrag.initialScale) {
                        newLoc.scale = this.mDrag.initialScale[presid];
                        newLoc.scaleTime = time;
                        gfxLoc.scale = newLoc.scale;
                        remote_pres.mLocation.scale = newLoc.scale;
                        remote_pres.mLocation.scaleTime = time;
                    }
                    if (this.mDrag.initialOrient && presid in this.mDrag.initialOrient) {
                        newLoc.orient = this.mDrag.initialOrient[presid];
                        newLoc.orientTime = time;
                        gfxLoc.orient = newLoc.orient;
                        remote_pres.mLocation.orient = newLoc.orient;
                        remote_pres.mLocation.orientTime = time;
                    }
                    if (this.mDrag.origstart) {
                        var from = this.mDrag.start;
                        var to = this.mDrag.origstart;
                        var deltaPos = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
                        newLoc.pos = [newLoc.pos[0] + deltaPos[0], newLoc.pos[1] + deltaPos[1], newLoc.pos[2] + deltaPos[2]];
                        newLoc.posTime = time;
                        gfxLoc.pos = newLoc.pos;
                        remote_pres.mLocation.pos = newLoc.pos;
                        remote_pres.mLocation.posTime = time;
                    }
                    gfxLoc.time = time + Example.BlessedScript.GFX_TIMESTAMP_OFFSET;
                    var msg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                        remote_pres.space(),
                        remote_pres.id(),
                        remote_pres,
                        { loc : gfxLoc }
                    );
                    //console.log("Abort drag", newLoc, msg);
                    this._sendHostedObjectMessage(msg);
                    this.setRemoteObjectLocation(this.mPresence,
                                                 remote_pres,
                                                 newLoc);
                }
            });
            this.mDrag.destroyed = true;
            this.mDrag = null;
        }
    };
    Example.BlessedScript.prototype._moveSelected = function(dragObject, commit) {
        var msg = dragObject.lastDragMsg;
        var camdir = msg.cameradir;
        if (dragObject.moveInPlane) {
            camdir = dragObject.camdir;
        }
        var length = dragObject.planedist / (msg.dir[0]*camdir[0] +
                                             msg.dir[1]*camdir[1] +
                                             msg.dir[2]*camdir[2]);
        var cam = msg.camerapos;
        var end = [msg.dir[0] * length + cam[0], msg.dir[1] * length + cam[1], msg.dir[2] * length + cam[2]];
        var start = dragObject.start;

        var newDeltaPos = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
        var origDeltaPos = dragObject.origstart ? [start[0] - dragObject.origstart[0],
                start[1] - dragObject.origstart[1], start[2] - dragObject.origstart[2]] : [0,0,0];
        var deltaPos = [newDeltaPos[0] + origDeltaPos[0], newDeltaPos[1] + origDeltaPos[1], newDeltaPos[2] + origDeltaPos[2]];

        var deltaPosLen = Math.sqrt(deltaPos[0]*deltaPos[0]+
            deltaPos[1]*deltaPos[1]+deltaPos[2]*deltaPos[2]);
        var test = (camdir[0])*msg.dir[0] + (camdir[1])*msg.dir[1] + (camdir[2])*msg.dir[2];
        if (dragObject.moveInPlane && (deltaPosLen > 20 || !(test <= 0))) {
            if (test > 0) deltaPosLen = -deltaPosLen;
            for (var i = 0; i < 3; i++) {
                deltaPos[i] = deltaPos[i]*20/deltaPosLen;
            }
        }
        deltaPos = [deltaPos[0] - origDeltaPos[0], deltaPos[1] - origDeltaPos[1], deltaPos[2] - origDeltaPos[2]];
        // Compare with self to check for NaN.
        if (!(deltaPos[0] == deltaPos[0]) || !(deltaPos[1] == deltaPos[1]) || !(deltaPos[2] == deltaPos[2])) {
            Kata.log("Got NaN in deltaPos computation.");
            deltaPos = [0,0,0];
        }
        if (dragObject.moveInPlane) {
            deltaPos[1] = 0;
        }
        if (commit) {
            if (!dragObject.origstart) {
                dragObject.origstart = start;
            }
            dragObject.start = [start[0]+deltaPos[0], start[1]+deltaPos[1], start[2]+deltaPos[2]];
        }
        this.foreachSelected(this.mPresence.mSpace, function(presid) {
            var remote_pres = this.getRemotePresence(presid);
            if (remote_pres) {
                var time = Kata.now(remote_pres.mSpace);
                var oldPos = remote_pres.position(time);
                var newPos = [oldPos[0] + deltaPos[0], oldPos[1] + deltaPos[1], oldPos[2] + deltaPos[2]];
                var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                var gfxLoc = {};
                newLoc.pos = newPos;
                newLoc.posTime = time;
                gfxLoc.pos = newPos;
                gfxLoc.time = time + Example.BlessedScript.GFX_TIMESTAMP_OFFSET;
                var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                    remote_pres.space(),
                    remote_pres.id(),
                    remote_pres,
                    { loc : gfxLoc }
                );
                this._sendHostedObjectMessage(gfxmsg);
                if (commit) {
                    remote_pres.mLocation.pos = newLoc.pos;
                    remote_pres.mLocation.posTime = time;
                    this.setRemoteObjectLocation(this.mPresence,
                                                 remote_pres,
                                                 newLoc);
                    // Make change permanent!
                    remote_pres._updateLoc({pos: newLoc.pos, time: time});
                }
            }
        });
    };

    Example.BlessedScript.GFX_TIMESTAMP_OFFSET = 5000;
    Example.BlessedScript.prototype.startDragAction=function(which) {
        this.mDrag = this.mDragPrepare;
        var camdir = this.mDrag.origCameraDir;
        if (which == "dragXZ") {
            if (this.mDrag.dir[1] > 0) {
                camdir = [0,-1,0];
            } else {
                camdir = [0,1,0];
            }
            this.mDrag.camdir = camdir;
        }
        var dx = (this.mDrag.start[0] - this.mDrag.camerapos[0]);
        var dy = (this.mDrag.start[1] - this.mDrag.camerapos[1]);
        var dz = (this.mDrag.start[2] - this.mDrag.camerapos[2]);
        var planedist = dx*camdir[0] + dy*camdir[1] + dz*camdir[2];
        this.mDrag.planedist = planedist;
        this.mDrag.moveInPlane = (which == "dragXZ");
        var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXEnableEvent(null, "mousemove");
        this._sendHostedObjectMessage(gfxmsg);
        
    };
    Example.BlessedScript.prototype._handleGUIMessage = function (channel, msg) {
        Kata.GraphicsScript.prototype._handleGUIMessage.call(this,channel,msg);
        if (msg.msg=="MeshAspectRatio") {
            if (msg.id==this.mPresence.id()) {
                this._scale=[0,msg.aspect[1]*this._scale[3],0,this._scale[3]];
                this.mPresence.setScale(this._scale);
            }
        }
        if (msg.msg == 'chat')
            this.handleChatGUIMessage(msg);
        if (msg.msg == 'create') {
            Kata.log("Creating object with visual "+msg.event.visual+" orient "+msg.event.orient);
            this.handleCreateObject(msg.event.visual, msg.event.pos, msg.event.orient);
        }
        if (msg.msg == 'sit') {
            this.handleSitGUIMessage(msg);
        }
        if (msg.msg == 'panorama') {
            this.handlePanoramaGUIMessage(msg);
        }
        if (msg.msg == "mousedown") {
        }
        if (msg.msg == "mouseup") {
        }
        if (msg.msg == "abort") {
            this.resetDrag();
        }
        if (msg.msg == "delete") {
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (remote_pres) {
                    var payload=JSON.stringify({"msg": "delete"});
                    var sendPort = this.mPresence.bindODPPort(Example.ObjectScript.kMsgPort+1);
                    sendPort.send(new Kata.ODP.Endpoint(remote_pres, Example.ObjectScript.kMsgPort),payload);
                    sendPort.close();
                }
            });
            this.clearSelection(msg.spaceid);
        }
        if (msg.msg == "physics") {
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (remote_pres) {
                    var payload=JSON.stringify({"msg": "physics", "data": this.makePhysicsData(msg.event)});
                    var sendPort = this.mPresence.bindODPPort(Example.ObjectScript.kMsgPort+1);
                    sendPort.send(new Kata.ODP.Endpoint(remote_pres, Example.ObjectScript.kMsgPort),payload);
                    sendPort.close();
                }
            });
        }
        if (msg.msg == "snap") {
            this.snapToGrid();
        }
        if (msg.msg == "import") {
            this.doImport(msg.event.serialized);
        }
        if (msg.msg == "export") {
            var gfxmsg = new Kata.ScriptProtocol.FromScript.GUIMessage(
                "scenedump",
                {serialized: this.doExport() });
            this._sendHostedObjectMessage(gfxmsg);
        }

        if (msg.msg == "setslider") {
            this.mDrag = this.mDrag || {};
            var deltaScale = msg.event.value;
            var y_radians = msg.event.y_radians;
            if (!this.mDrag.setslider) {
                this.mDrag.setslider = true;
                this.mDrag.initialScale = {};
                this.mDrag.initialOrient = {};
                this.foreachSelected(this.mPresence.mSpace, function(presid) {
                    var remote_pres = this.getRemotePresence(presid);
                    if (remote_pres) {
                        var time = Kata.now(remote_pres.mSpace);
                        this.mDrag.initialOrient[presid] = remote_pres.orientation(time);
                        this.mDrag.initialScale[presid] = remote_pres.scale(time);
                    }
                });
            }
            this.foreachSelected(this.mPresence.mSpace, function(presid) {
                var remote_pres = this.getRemotePresence(presid);
                if (presid in this.mDrag.initialOrient && presid in this.mDrag.initialScale && remote_pres) {
                    var time = Kata.now(remote_pres.mSpace);
                    var oldScale = this.mDrag.initialScale[presid];
                    var oldQuat = this.mDrag.initialOrient[presid];
                    var newScale = [oldScale[0] * deltaScale, oldScale[1] * deltaScale, oldScale[2] * deltaScale, oldScale[3] * deltaScale];
                    var newQuat = Kata.extrapolateQuaternion(oldQuat, y_radians, [0,1,0], 1.0);
                    var newLoc = Kata.LocationExtrapolate(remote_pres.predictedLocation(), time);
                    var gfxLoc = {};
                    newLoc.scale = newScale;
                    newLoc.scaleTime = time;
                    gfxLoc.scale = newScale;
                    newLoc.orient = newQuat;
                    newLoc.orientTime = time;
                    gfxLoc.orient = newQuat;
                    gfxLoc.time = time + Example.BlessedScript.GFX_TIMESTAMP_OFFSET;
                    var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXMoveNode(
                        remote_pres.space(),
                        remote_pres.id(),
                        remote_pres,
                        { loc : gfxLoc }
                    );
                    this._sendHostedObjectMessage(gfxmsg);
                    if (msg.event.commit) {
                        // Make change permanent!
                        remote_pres.mLocation.scale = newScale;
                        remote_pres.mLocation.scaleTime = time;
                        remote_pres.mLocation.orient = newQuat;
                        remote_pres.mLocation.orientTime = time;
                        this.setRemoteObjectLocation(this.mPresence,
                                                     remote_pres,
                                                     newLoc);
                    }
                    remote_pres._updateLoc({orient: newQuat, scale: newScale, time: time});
                }
            });
        }
        if (msg.msg == "pieaction") {
            var which = msg.event.msg;
            if (which == "transform-show") {
                var gfxmsg = new Kata.ScriptProtocol.FromScript.GUIMessage("transform", {action: "show", x: msg.event.x, y: msg.event.y});
                this._sendHostedObjectMessage(gfxmsg);
            } else if (which == "drag2D" || which == "dragXZ") {
                this.startDragAction(which);
            }
        }
        if (msg.msg == "pick") {
            if (msg.button == 2) {
                this.resetDrag();
            } else {
                this.mDrag = null;
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
            }
            var gfxmsg = new Kata.ScriptProtocol.FromScript.GUIMessage("transform", {action: "hide"});
            this._sendHostedObjectMessage(gfxmsg);
            if (!msg.ctrlKey) {
                if (this.numSelected(msg.spaceid) > 0) {
                    var buttons = [
                        {img: "ui-icon-arrow-4", title: "Drag", msg: "drag2D"},
                        {img: "ui-icon-arrowthick-2-e-w", title: "Slide", msg: "dragXZ"},
                        {img: "ui-icon-info", title: "Info", msg: "foobar"},
                        {img: "ui-icon-cart", title: "Control", msg: "farboo"},
                        {img: "ui-icon-gear", title: "Edit", msg: "transform-show"}
                    ];
                    var gfxmsg = new Kata.ScriptProtocol.FromScript.GUIMessage("pie", {
                                                                                   action: "show",
                                                                                   x: msg.clientX,
                                                                                   y: msg.clientY,
                                                                                   buttons: buttons
                                                                               });
                    this._sendHostedObjectMessage(gfxmsg);
                }
            }
            if (msg.pos && msg.camerapos) {
                var dx = (msg.pos[0] - msg.camerapos[0]);
                var dy = (msg.pos[1] - msg.camerapos[1]);
                var dz = (msg.pos[2] - msg.camerapos[2]);
                var length = Math.sqrt(dx*dx + dy*dy + dz*dz);
                this.mDragPrepare = {camerapos: msg.camerapos, dir: msg.dir,
                                     origCameraDir: msg.cameradir, start: msg.pos, dist:length,
                                     allowMoveCommit: true};
            }
            if (msg.ctrlKey) {
                this.startDragAction("dragXZ");
            }
        }
        // Check if we are dragging and we are not adjusting sliders (which also counts as a drag)
        if ((msg.msg == "drag" || msg.msg == "drop" || msg.msg == "mousemove") && this.mDrag && !this.mDrag.setslider) {
            var thus = this;
            var dragObject = this.mDrag;
            dragObject.lastDragMsg = msg;
            if (dragObject.allowMoveCommit) {
                var intid = setInterval(function(){
                    if (!dragObject.destroyed && dragObject.moved) {
                        dragObject.moved = false;
                        thus._moveSelected(dragObject, true);
                    } else {
                        clearInterval(intid);
                        dragObject.allowMoveCommit = true;
                    }
                }, 200);
            }
            dragObject.moved = !dragObject.allowMoveCommit;
            thus._moveSelected(dragObject, dragObject.allowMoveCommit);
            dragObject.allowMoveCommit = false;
            //commit = msg.msg == "drop";
        }
        if (msg.msg == "drop" || msg.msg == "click") {
            this.mDrag = null;
            var gfxmsg = new Kata.ScriptProtocol.FromScript.GFXEnableEvent(null, "mousemove");
            this._sendHostedObjectMessage(gfxmsg);
/*
            for (var id in this.mSelected) {
                // if nonempty...
                this._sendHostedObjectMessage(gfxmsg);
                break;
            }
*/
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
            if (this.keyIsDown[this.Keys.W]||this.keyIsDown[this.Keys.S]) {
                avSpeed=10;
            }
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
            if (this.keyIsDown[this.Keys.UP]||this.keyIsDown[this.Keys.W]) {
                this.mPresence.setVelocity([-avZX, -avZY, -avZZ]);
                this.disableSitting();
            }
            if (this.keyIsDown[this.Keys.DOWN]||this.keyIsDown[this.Keys.S]) {
                this.mPresence.setVelocity([avZX, avZY, avZZ]);
            }
            var full_rot_seconds = 10.0;
            if (this.keyIsDown[this.Keys.LEFT]||this.keyIsDown[this.Keys.A]) {
                this.mPresence.setAngularVelocity(
                    Kata.Quaternion.fromAxisAngle([0, 1, 0], 2.0*Math.PI/full_rot_seconds)
                );
                this.disableSitting();
            }
            if (this.keyIsDown[this.Keys.RIGHT]||this.keyIsDown[this.Keys.D]) {
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
        if (this.panorama)
            return 10;
        // FIXME there should be a better way of deciding this
        return (remote._animatedState && (remote._animatedState.idle == 'sit')) ? .75 : 1.5;
    };
    Example.BlessedScript.prototype._getHorizontalOffset = function() {
        if (this.panorama)
            return 40;
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
    Example.BlessedScript.prototype.doImport = function(serialized) {
        if (serialized.v != 1) {
            //
        }
        var scene = serialized.scene;
        for (var i = 0; i < scene.length; i++) {
            this.handleCreateObject(scene[i].visual, scene[i].position,
                              scene[i].orientation, scene[i].bounds);
        }
    };
    Example.BlessedScript.prototype.doExport = function() {
        var scene = [];
        for (var id in this.mRemotePresences) {
            var remotePresence = this.mRemotePresences[id];
            if (!remotePresence || !remotePresence.id) {
                continue; // FIXME: Why do we have undefined stuff in here?
            }
            var time = Kata.now(this.mPresence.mSpace);
            var obj = {
                id: remotePresence.id(),
                space: remotePresence.space(),
                position: remotePresence.position(time),
                orientation: remotePresence.orientation(time),
                scale: remotePresence.scale(time),
                bounds: remotePresence.bounds(time),
                visual: remotePresence.visual()
            };
            if (!obj.visual) {
                // See objectscript.js for setVisual("") hack.
                // our current hack for deleting objects.
                continue;
            }
            scene.push(obj);
        }
        var serialized = {
            v: 1,
            scene: scene
        };
        return serialized;
    };
}, '../../scripts/BlessedScript.js');
