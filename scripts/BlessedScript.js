
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
                "Blessed", this,
                Kata.bind(this.chatEnterEvent, this),
                Kata.bind(this.chatExitEvent, this),
                Kata.bind(this.chatMessageEvent, this)
            );
    };
    Kata.extend(Example.BlessedScript, SUPER);

    Example.BlessedScript.prototype.chatEnterEvent = function(remote, name) {
        Kata.warn("chat enter: " + name);
    };
    Example.BlessedScript.prototype.chatExitEvent = function(remote, name, msg) {
        Kata.warn("chat exit: " + name);
    };
    Example.BlessedScript.prototype.chatMessageEvent = function(remote, name, msg) {
        Kata.warn("chat: " + name + " says " + msg);
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
    Example.BlessedScript.prototype._handleGUIMessage = function(channel, msg){
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
            if (this.rightDown) {
                this.avPointX = parseInt(msg.event.x) - this.dragStartX;
                this.avPointY = parseInt(msg.event.y) - this.dragStartY;
                var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                this.mPresence.setOrientation(q);
            }
        }
        if (msg.msg == "keyup") {
            this.keyIsDown[msg.event.keyCode] = false;
            this.mPresence.setVelocity([0, 0, 0]);
        }
        
        if (msg.msg == "keydown") {
            var avMat = Kata.QuaternionToRotation(this.mPresence.orientation(new Date()));
            var avSpeed = 30
            var avXX = avMat[0][0] * avSpeed;
            var avXY = avMat[0][1] * avSpeed;
            var avXZ = avMat[0][2] * avSpeed;
            var avZX = avMat[2][0] * avSpeed;
            var avZY = avMat[2][1] * avSpeed;
            var avZZ = avMat[2][2] * avSpeed;
            this.keyIsDown[msg.event.keyCode] = true;
            var k = "" + msg.event.keyCode
            if (msg.event.shiftKey) 
                k += "S"
            if (msg.event.ctrlKey) 
                k += "C"
            switch (k) {
                case "65": // A -- left
                    this.mPresence.setVelocity([-avXX, -avXY, -avXZ]);
                    break;
                case "68": // D -- right
                    this.mPresence.setVelocity([avXX, avXY, avXZ]);
                    break;
                case "87": // W -- forward
                case "38": // up arrow
                    this.mPresence.setVelocity([-avZX, -avZY, -avZZ]);
                    break;
                case "83": // S -- reverse
                case "40": // down arrow
                    this.mPresence.setVelocity([avZX, avZY, avZZ]);
                    break;
                case "82": // R -- raise av
                case "33": // page up
                    this.mPresence.setVelocity([0, 30, 0]);
                    break;
                case "70": // F -- lower av
                case "34": // page down
                    this.mPresence.setVelocity([0, -30, 0]);
                    break;
                case "81":
                case "37": // left arrow: look left
                    this.avPointX -= 10;
                    var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "69":
                case "39": // right arrow: look right
                    this.avPointX += 10;
                    var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "38S": // shift+up: look up
                    this.avPointY -= 10;
                    var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "40S": // shift+down: look down
                    this.avPointY += 10;
                    var q = this._euler2Quat(this.avPointX * -.25, this.avPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "32":
                    this.updateAvatar();
            }
        }
        if (msg.msg == "wheel") {
            this.avPos = this.mPresence.position(new Date());
            if (this.leftDown || this.middleDown || this.rightDown) 
                return;
            var ang = this.avPointX * -.25 * 0.0174532925;
            var x = Math.sin(ang) * 5;
            var y = Math.cos(ang) * 5;
            if (msg.event.dy > 0) {
                this.avPos[0] -= x;
                this.avPos[2] -= y;
                this.mPresence.setPosition(this.avPos);
            }
            else {
                this.avPos[0] += x;
                this.avPos[2] += y;
                this.mPresence.setPosition(this.avPos);
            }
        }
    };

    // update avatar (which is us)
    Example.BlessedScript.prototype.updateAvatar = function(){
        this.avPos = this.mPresence.position();
        this.avOrient = this.mPresence.orientation();
        this.avVel = this.mPresence.velocity()
        console.log("DEBUG updateAvatar:", this.avPos, this.avOrient, this.avVel);
    };
})();
