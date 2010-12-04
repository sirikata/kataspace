
Kata.require([
    "katajs/oh/Script.js",
    "katajs/oh/GraphicsScript.js"
], function() {
    if (typeof(Example) === "undefined") {
        Example = {};
    }
    
    var SUPER = Kata.GraphicsScript.prototype;
    Example.ObjectScript = function(channel, args){
        SUPER.constructor.call(this, channel, args);
        
        this.mNearby = {};
        var thus=this;
        Kata.log("Connecting to "+args.space+" with "+args.visual+" from "+args.creator+ " at "+args.pos);
        this.connect(args,
                     args.auth?args.auth:null,
                     function(presence) {
                         thus.mPresence = presence;
                         if (args.creator) {
                             var space=args.space;
                             var creator=args.creator;
                             delete args.space;
                             delete args.creator;
                             delete args.auth;
                             presence.setPosition(args.pos);
                             if (args.port!==undefined)
                                 thus.notifyCreator(presence,creator,args.port,args.receipt);
                             Kata.log("Connected subobject\n");
                         }
                         // Start periodic movements
                         //thus.move();
                     });
    };
    
    Kata.extend(Example.ObjectScript, SUPER);
    Example.ObjectScript.prototype.notifyCreator = function(presence,creator,port,receipt) {
        var returnReceiptPort=presence.bindODPPort(port);
        var timeout=10;
        var thus=this;
        var send=null;
        var dst=new Kata.ODP.Endpoint(presence.mSpace,creator,port);

        send=function() {
            if (returnReceiptPort&&timeout<100000) {//FIXME: have a mechanism to give up returning receipts
                returnReceiptPort.send(dst,receipt);
                setTimeout(send,timeout);
                timeout*=1.5;
            }else {
                if (returnReceiptPort)
                    returnReceiptPort.close();
            }
        };
        returnReceiptPort.receiveFrom(dst,function() {
                                          if (returnReceiptPort)
                                              returnReceiptPort.close();
                                          returnReceiptPort=null;                                          
                                      });
        send();
    };
/*    
    Example.TestScript.prototype.move = function(){
        if (!this.mPresence) 
            return;
        
        var pos = [0,0,0];
        console.log("move mPresence.setPosition:", pos[0], pos[1], pos[2]);
        this.mPresence.setPosition(pos);
    };
*/
}, '../../objectscript.js');
