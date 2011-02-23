
// Global namespace.
var Example;

Kata.require([
    'katajs/oh/GraphicsScript.js',
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

    Example.BlessedScript.prototype.connected = function(presence, space, reason) {
        if (!presence) {
            // If we failed to connect, notify the user
            var evt = { status : 'failed', reason : reason };
            var msg = new Kata.ScriptProtocol.FromScript.GUIMessage("connection", evt);
            this._sendHostedObjectMessage(msg);
            Kata.warn("connection failure");
            return;
        }

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
        RIGHT : 39
    };

    Example.BlessedScript.prototype._handleGUIMessage = function (channel, msg) {
        Kata.GraphicsScript.prototype._handleGUIMessage.call(this,channel,msg);
        if (msg.msg=="MeshAspectRatio") {
            if (msg.id==this.mPresence.id()) {
                this._scale=[0,msg.aspect[1]*this._scale[3],0,this._scale[3]];
                Kata.log("XXXXXXXXXXXAdjusting scale to "+this._scale);
                this.mPresence.setScale(this._scale);
            }
        }
        if (msg.msg == 'chat')
            this.handleChatGUIMessage(msg);

        if (msg.msg == 'sit')
            this.handleSitGUIMessage(msg);

        if (msg.msg == "mousedown") {
            if (msg.event.which == 0) 
                this.leftDown = true;
            if (msg.event.which == 1) 
                this.middleDown = true;
            if (msg.event.which == 2) {
                this.rightDown = true;
            }
        }
        if (msg.msg == "mouseup") {
            if (msg.event.which == 0) 
                this.leftDown = false;
            if (msg.event.which == 1) 
                this.middleDown = false;
            if (msg.event.which == 2) 
                this.rightDown = false;
        }
        if (msg.msg == "mousemove") {
            /// Firefox 4 bug: ev.which is always 0, so get it from mousedown/mouseup events
            /*            
            if (this.rightDown) {
                this.avPointX = parseFloat(msg.event.x)*-.25 - this.dragStartX;
                this.avPointY = parseFloat(msg.event.y)*-.25 - this.dragStartY;
                var q = this._euler2Quat(this.avPointX, this.avPointY, 0);
                this.mPresence.setOrientation(q);
                this.setCameraPosOrient(null, q);
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
            var avXX = avMat[0][0] * avSpeed;
            var avXY = avMat[0][1] * avSpeed;
            var avXZ = avMat[0][2] * avSpeed;
            var avZX = avMat[2][0] * avSpeed;
            var avZY = avMat[2][1] * avSpeed;
            var avZZ = avMat[2][2] * avSpeed;
            this.keyIsDown[msg.keyCode] = true;

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
        return (remote._animatedState && (remote._animatedState.idle == 'sit')) ? .75 : 1.5;
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
