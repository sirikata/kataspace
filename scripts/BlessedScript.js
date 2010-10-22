
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
        this.camSpeed = 0;
        this.cameraPointX=0;
        this.cameraPointY=0;
        this.cameraPointXInit=0;
        this.cameraPointYInit=0;
        this.cameraPos=[0,0,0];
        this.cameraPosInit=this.cameraPos.concat();
        this.cameraOrient=[0,0,0,1];
        this.cameraOrientInit=this.cameraOrient.concat();

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
        presence.setPosition(this.cameraPos);
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
                this.dragStartX = parseInt(msg.event.x) - this.cameraPointX;
                this.dragStartY = parseInt(msg.event.y) - this.cameraPointY;
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
                this.cameraPointX = parseInt(msg.event.x) - this.dragStartX;
                this.cameraPointY = parseInt(msg.event.y) - this.dragStartY;
                var q = this._euler2Quat(this.cameraPointX * -.25, this.cameraPointY * -.25, 0);
                this.mPresence.setOrientation(q);
            }
        }
        if (msg.msg == "keyup") {
            this.keyIsDown[msg.event.keyCode] = false;
            this.mPresence.setVelocity([0, 0, 0]);
        }
        
        if (msg.msg == "keydown") {
            var camMat = Kata.QuaternionToRotation(this.mPresence.orientation(new Date()));
            var camSpeed = 30
            var camXX = camMat[0][0] * camSpeed;
            var camXY = camMat[0][1] * camSpeed;
            var camXZ = camMat[0][2] * camSpeed;
            var camZX = camMat[2][0] * camSpeed;
            var camZY = camMat[2][1] * camSpeed;
            var camZZ = camMat[2][2] * camSpeed;
            this.keyIsDown[msg.event.keyCode] = true;
            var k = "" + msg.event.keyCode
            if (msg.event.shiftKey) 
                k += "S"
            if (msg.event.ctrlKey) 
                k += "C"
            switch (k) {
                case "65": // A -- left
                    //this.cameraPos[0]-=y;
                    //this.cameraPos[2]+=x;
                    this.mPresence.setVelocity([-camXX, -camXY, -camXZ]);
                    break;
                case "68": // D -- right
                    //this.cameraPos[0]+=y;
                    //this.cameraPos[2]-=x;
                    this.mPresence.setVelocity([camXX, camXY, camXZ]);
                    //this.mPresence.setPosition(this.cameraPos);
                    break;
                case "87": // W -- forward
                case "38": // up arrow
                    //this.cameraPos[0]-=x;
                    //this.cameraPos[2]-=y;
                    this.mPresence.setVelocity([-camZX, -camZY, -camZZ]);
                    //this.mPresence.setPosition(this.cameraPos);
                    break;
                case "83": // S -- reverse
                case "40": // down arrow
                    //this.cameraPos[0]+=x;
                    //this.cameraPos[2]+=y;
                    this.mPresence.setVelocity([camZX, camZY, camZZ]);
                    //this.mPresence.setPosition(this.cameraPos);
                    break;
                case "82": // R -- raise camera
                case "33": // page up
                    //this.cameraPos[1]+=1.0;
                    this.mPresence.setVelocity([0, 30, 0]);
                    //this.mPresence.setPosition(this.cameraPos);
                    break;
                case "70": // F -- lower camera
                case "34": // page down
                    //this.cameraPos[1]-=1.0;
                    this.mPresence.setVelocity([0, -30, 0]);
                    //this.mPresence.setPosition(this.cameraPos);
                    break;
                case "81":
                case "37": // left arrow: look left
                    this.cameraPointX -= 10;
                    var q = this._euler2Quat(this.cameraPointX * -.25, this.cameraPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "69":
                case "39": // right arrow: look right
                    this.cameraPointX += 10;
                    var q = this._euler2Quat(this.cameraPointX * -.25, this.cameraPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "38S": // shift+up: look up
                    this.cameraPointY -= 10;
                    var q = this._euler2Quat(this.cameraPointX * -.25, this.cameraPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
                case "40S": // shift+down: look down
                    this.cameraPointY += 10;
                    var q = this._euler2Quat(this.cameraPointX * -.25, this.cameraPointY * -.25, 0);
                    this.mPresence.setOrientation(q);
                    break;
            }
        }
        if (msg.msg == "wheel") {
            this.cameraPos = this.mPresence.position(new Date());
            if (this.leftDown || this.middleDown || this.rightDown) 
                return;
            var ang = this.cameraPointX * -.25 * 0.0174532925;
            var x = Math.sin(ang) * 5;
            var y = Math.cos(ang) * 5;
            if (msg.event.dy > 0) {
                this.cameraPos[0] -= x;
                this.cameraPos[2] -= y;
                this.mPresence.setPosition(this.cameraPos);
            }
            else {
                this.cameraPos[0] += x;
                this.cameraPos[2] += y;
                this.mPresence.setPosition(this.cameraPos);
            }
        }
    };
})();
