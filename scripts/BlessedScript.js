
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

        this.cameraPointX=0;
        this.cameraPointY=0;
        this.cameraPos=[0,0,0];

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
    Example.BlessedScript.prototype._handleGUIMessage = function (channel, msg) {
        if (msg.msg == "mousedown") {
            console.log("DEBUG mousedown:", msg, msg.event)
            this.dragStartX = parseInt(msg.event.x)-this.cameraPointX;
            this.dragStartY = parseInt(msg.event.y)-this.cameraPointY;
        }
        if (msg.msg == "mousemove") {
            this.cameraPointX = parseInt(msg.event.x) - this.dragStartX;
            this.cameraPointY = parseInt(msg.event.y) - this.dragStartY;
            var q = this._euler2Quat(this.cameraPointX*-.25, this.cameraPointY*-.25, 0);
            console.log("DEBUG -- mousemove:", msg.event.x, "|", this.cameraPointX, "|", this.dragStartX, "|", q);
            this.mPresence.setOrientation(q);
        }
        if (msg.msg == "keydown") {
            var ang = this.cameraPointX*-.25 *  0.0174532925;
            var x = Math.sin(ang);
            var y = Math.cos(ang);
            switch(msg.event.keyCode) {
                case 65:
                    this.cameraPos[0]-=y;
                    this.cameraPos[2]+=x;
                    this.mPresence.setPosition(this.cameraPos);
                    break;
                case 68:
                    this.cameraPos[0]+=y;
                    this.cameraPos[2]-=x;
                    this.mPresence.setPosition(this.cameraPos);
                    break;
                case 87:
                    this.cameraPos[0]-=x;
                    this.cameraPos[2]-=y;
                    this.mPresence.setPosition(this.cameraPos);
                    break;
                case 83:
                    this.cameraPos[0]+=x;
                    this.cameraPos[2]+=y;
                    this.mPresence.setPosition(this.cameraPos);
                    break;
                case 82:
                    this.cameraPos[1]+=1.0;
                    this.mPresence.setPosition(this.cameraPos);
                    break;
                case 76:
                    this.cameraPos[1]-=1.0;
                    this.mPresence.setPosition(this.cameraPos);
                    break;
            }
        }
    };
})();
