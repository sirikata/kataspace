
Kata.include("katajs/oh/GraphicsScript.js");
// FIXME we want to be able to specify a centralized offset so we
// don't have to have this ../../ stuff here.
Kata.include("../../scripts/behavior/chat/Chat.js");

var Example;
(function(){
    if (typeof(Example) === "undefined") {
        Example = {};
    }

    var SUPER = Kata.GraphicsScript.prototype;
    Example.BlessedScript = function(channel, args){
        SUPER.constructor.call(this, channel, args);

        console.log("args:", args, args.mesh, document.URL + "blue.dae")
        this.connect(args, null, Kata.bind(this.connected, this));
        
        this.keyIsDown = {};
        this.avSpeed = 0;
        this.avVel = [0,0,0]
        this.avPointX=0;
        this.avPointY=0;
        this.avPos=[0,0,0];
        this.avOrient=[0,0,0,1];

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
        presence.setPosition(this.avPos);
        Kata.warn("Got connected callback.");
    };

    Example.BlessedScript.prototype._euler2Quat = function(yaw, pitch, roll){
        // takes degrees; roll = rotation about z, pitch = x, yaw = y
        var k = 0.00872664625; // deg2rad/2
        var yawcos = Math.cos(roll * k);
        var yawsin = Math.sin(roll * k);
        var pitchcos = Math.cos(pitch * k);
        var pitchsin = Math.sin(pitch * k);
        var rollcos = Math.cos(yaw * k);
        var rollsin = Math.sin(yaw * k);
        return [rollcos * pitchsin * yawcos + rollsin * pitchcos * yawsin,
                rollsin * pitchcos * yawcos - rollcos * pitchsin * yawsin,
                rollcos * pitchcos * yawsin - rollsin * pitchsin * yawcos,
                rollcos * pitchcos * yawcos + rollsin * pitchsin * yawsin];
    };

    Example.BlessedScript.prototype.Keys = {
        UP : 38,
        DOWN : 40,
        LEFT : 37,
        RIGHT : 39
    };

    Example.BlessedScript.prototype._euler2Quat = function(yaw, pitch, roll){
        // takes degrees; roll = rotation about z, pitch = x, yaw = y
        var k = 0.00872664625; // deg2rad/2
        var yawcos = Math.cos(roll * k);
        var yawsin = Math.sin(roll * k);
        var pitchcos = Math.cos(pitch * k);
        var pitchsin = Math.sin(pitch * k);
        var rollcos = Math.cos(yaw * k);
        var rollsin = Math.sin(yaw * k);
        return [rollcos * pitchsin * yawcos + rollsin * pitchcos * yawsin, 
                rollsin * pitchcos * yawcos - rollcos * pitchsin * yawsin, 
                rollcos * pitchcos * yawsin - rollsin * pitchsin * yawcos, 
                rollcos * pitchcos * yawcos + rollsin * pitchsin * yawsin];
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
                this.dragStartX = parseInt(msg.event.x) - this.avPointX;
                this.dragStartY = parseInt(msg.event.y) - this.avPointY;
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
                this.avPointX = parseInt(msg.event.x) - this.dragStartX;
                this.avPointY = parseInt(msg.event.y) - this.dragStartY;
                var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                this.mPresence.setOrientation(q);
            }
            */
        }
        if (msg.msg == "keyup") {
            this.keyIsDown[msg.event.keyCode] = false;
            if ( !this.keyIsDown[this.Keys.UP] && !this.keyIsDown[this.Keys.DOWN])
                this.mPresence.setVelocity([0, 0, 0]);
        }

        if (msg.msg == "keydown") {
            var avMat = Kata.QuaternionToRotation(this.mPresence.predictedOrientation(new Date()));
            var avSpeed = 5;
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
                this.mPresence.setVelocity([avZX, avZY, avZZ]);
            }
            if (this.keyIsDown[this.Keys.LEFT]) {
                this.avPointX -= 10;
                var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                this.mPresence.setOrientation(q);
                this.setCameraPosOrient(null, q);
            }
            if (this.keyIsDown[this.Keys.RIGHT]) {
                this.avPointX += 10;
                var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                this.mPresence.setOrientation(q);
                this.setCameraPosOrient(null, q);
            }
        }

        // We could be more selective about this, making sure we
        // actually made a change, but this is safe: always push an
        // update to the GFX system for our info.
        this.updateGFX(this.mPresence);
    };
})();
