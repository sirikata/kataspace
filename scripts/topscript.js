
Kata.include("katajs/oh/GraphicsScript.js");
Kata.include("katajs/oh/behavior/NamedObject.js");

(function(){
    if (typeof(Example) === "undefined") {
        Example = {};
    }

    var SUPER = Kata.GraphicsScript.prototype;
    Example.TestScript = function(channel, args){
        SUPER.constructor.call(this, channel, args);

        this.mNearby = {};
        this.connect(args, null, Kata.bind(this.connected, this));
        this.instance = Example.TestScript.instance;
        this.movecount = 0;
        this.movemax = 1;
        Example.TestScript.instance += 1;

        this.mNamedObject =
            new Kata.Behavior.NamedObject("Test", this);
    };
    Kata.extend(Example.TestScript, SUPER);

    Example.TestScript.prototype.connected = function(presence){
        this.mPresence = presence;
        // Start periodic movements
        this.mPresence.setPosition([0,0,-20]);
    };

    Example.TestScript.instance = 0;
})();
