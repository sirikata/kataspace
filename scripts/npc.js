if (typeof(Example) === "undefined") {
    Example = {};
}

Kata.require([
    'katajs/oh/GraphicsScript.js',
    '../../objectscript.js',
// FIXME we want to be able to specify a centralized offset so we
// don't have to have this ../../ stuff here.
    '../../scripts/behavior/chat/Chat.js',
    '../../scripts/behavior/animated/Animated.js'
], function(){
    
    var SUPER = Example.ObjectScript.prototype;
    Example.NPC = function(channel, args){
        SUPER.constructor.call(this, channel, args);
    };
    Kata.extend(Example.NPC, SUPER);
    Example.NPC.prototype.connect = function(args, auth, cb) {
         // query for all objects, since we need to display them.
         SUPER.connect.call(this, args, auth, cb, true);
     };
    
    
    
});
