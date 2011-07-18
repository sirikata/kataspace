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
         console.log("Special script "+JSON.stringify(args));
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
    Kata.extend(Example.NPC, SUPER);
    Example.NPC.prototype.connect = function(args, auth, cb) {
         // query for all objects, since we need to walk to some of them
         SUPER.connect.call(this, args, auth, cb, true);
     };
    Example.NPC.prototype.animatedSetState = function(remote, state) {
        remote._animatedState = state;
    };
    Example.NPC.prototype.connected=function(presence,space,reason){
        SUPER.connected.call(this,presence,space,reason);
        //this.queryRemoval(presence.space(),presence.id());
        setTimeout(Kata.bind(this.evaluateDestination,this,presence),4096);
    };
    Example.NPC.prototype.evaluateDestination=function(presence){
        for (var presence_id in this.mRemotePresences) {
            var pres = this.mRemotePresences[presence_id];
            console.log("NEARBY: "+pres.visual());
        }
        this.queryRemoval(presence.space(),presence.id());
        setTimeout(Kata.bind(this.validateNop,this,presence),20096);
    };
    Example.NPC.prototype.validateNop=function(presence) {
        for (var presence_id in this.mRemotePresences) {
            var pres = this.mRemotePresences[presence_id];
            console.log("XXNEARBY: "+pres.visual());
        }
    };
});
