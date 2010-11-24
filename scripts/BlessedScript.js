
// Global namespace.
var Example;

Kata.require([
    'katajs/oh/GraphicsScript.js',
// FIXME we want to be able to specify a centralized offset so we
// don't have to have this ../../ stuff here.
    '../../scripts/behavior/chat/Chat.js'
], function(){
    if (typeof(Example) === "undefined") {
        Example = {};
    }

    var SUPER = Kata.GraphicsScript.prototype;
    Example.BlessedScript = function(channel, args){
        SUPER.constructor.call(this, channel, args, Kata.bind(this.updateAnimation, this));

        console.log("args:", args, args.visual.mesh, Kata.scriptRoot, "blue.dae");
        this.connect(args, null, Kata.bind(this.connected, this));
        
        this.keyIsDown = {};

        this.mChatBehavior =
            new Kata.Behavior.Chat(
                args.name, this,
                Kata.bind(this.chatEnterEvent, this),
                Kata.bind(this.chatExitEvent, this),
                Kata.bind(this.chatMessageEvent, this)
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
    };
    Example.BlessedScript.prototype.chatExitEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('exit', name, msg));
    };
    Example.BlessedScript.prototype.chatMessageEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('say', name, msg));
    };

    Example.BlessedScript.prototype.handleChatGUIMessage = function(msg) {
        var revt = msg.event;
        this.mChatBehavior.chat(revt.msg);
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

    Example.BlessedScript.prototype.connected = function(presence){
        this.mPresence = presence;

        this.enableGraphicsViewport(presence, 0);
        presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        presence.setQuery(0);
        presence.setPosition([0,0,0]);
        this.setCameraPosOrient(this._calcCamPos(), [0,0,0,1], 0.0);
        // FIXME both this and the camera controls in GraphicsScript
        // are running on timers because the ones in GraphicsScript
        // don't accept velocity
        this.mCamUpdateTimer = setInterval(Kata.bind(this.updateCamera, this), 60);
        Kata.warn("Got connected callback.");
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
        if (msg.msg == 'chat')
            this.handleChatGUIMessage(msg);

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
            this.keyIsDown[msg.event.keyCode] = false;
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
            this.keyIsDown[msg.event.keyCode] = true;

            if (this.keyIsDown[this.Keys.UP]) {
                this.mPresence.setVelocity([-avZX, -avZY, -avZZ]);
            }
            if (this.keyIsDown[this.Keys.DOWN]) {
                //this.mPresence.setVelocity([avZX, avZY, avZZ]);
            }
            if (this.keyIsDown[this.Keys.LEFT]) {
                this.mPresence.setAngularVelocity(
                    Kata.Quaternion.fromAxisAngle([0, 1, 0], 2.0*Math.PI/5.0)
                );
            }
            if (this.keyIsDown[this.Keys.RIGHT]) {
                this.mPresence.setAngularVelocity(
                    Kata.Quaternion.fromAxisAngle([0, 1, 0], -2.0*Math.PI/5.0)
                );
            }
        }

        // We could be more selective about this, making sure we
        // actually made a change, but this is safe: always push an
        // update to the GFX system for our info.
        this.updateGFX(this.mPresence);
    };


    Example.BlessedScript.prototype.updateAnimation = function(presence, remote){
        var vel = remote.predictedVelocity();
        var angspeed = remote.predictedAngularSpeed();
        var is_mobile = (vel[0] != 0 || vel[1] != 0 || vel[2] != 0 || angspeed != 0);
        
        var cur_anim = remote.cur_anim;
        var new_anim = (is_mobile ? 'walk' : 'idle');
        
        if (cur_anim != new_anim) {
            this.animate(presence, remote, new_anim);
            remote.cur_anim = new_anim;
        }
    };
    Example.BlessedScript.prototype._calcCamPos = function() {
        var orient = new Kata.Quaternion(this._calcCamOrient());
        var pos = this.mPresence.predictedPosition(new Date());
        var offset = [0, 2, 5];
        var oriented_offset = orient.multiply(offset);
        return [pos[0] + oriented_offset[0],
                pos[1] + oriented_offset[1],
                pos[2] + oriented_offset[2]];
    };
    Example.BlessedScript.prototype._calcCamOrient = function(){
        return this.mPresence.predictedOrientation(new Date());
    };
}, '../../scripts/BlessedScript.js');
