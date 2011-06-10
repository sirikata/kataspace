
Kata.require([
    "katajs/oh/Script.js"
], function() {
    if (typeof(Example) === "undefined") {
        Example = {};
    }
    
    var SUPER = Kata.Script.prototype;
    Example.ObjectScript = function(channel, args){
        SUPER.constructor.call(this, channel, args);
        
        this.mNearby = {};
        var thus=this;
        Kata.log("Connecting to "+args.space+" with "+args.visual+" from "+args.creator+ " at "+args.loc.pos);
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
                             presence.setLocation(args.loc);
                             if (args.port!==undefined)
                                 thus.notifyCreator(presence,creator,args.port,args.receipt);
                             var movePort=presence.bindODPPort(Example.ObjectScript.kMovePort);
                             var msgPort=presence.bindODPPort(Example.ObjectScript.kMsgPort);
                             console.log("Registering listener at "+Example.ObjectScript.kMovePort, movePort);
                             movePort.receive(function(src, endpoint, payload){
                                                  var jsonstr = "";
                                                  for (var i = 0; i < payload.length; i++) {
                                                      jsonstr += String.fromCharCode(payload[i]);
                                                  }
                                                  //console.log("RECV PACKET WITH DATA "+jsonstr+" to "+JSON.stringify(src));
                                                  payload = JSON.parse(jsonstr);
                                                  if (payload) {
                                                      thus.mPresence.setLocation(payload);
                                                  }
                                              });
                             console.log("Registering listener at "+Example.ObjectScript.kMsgPort, msgPort);
                             msgPort.receive(function(src, endpoint, payload){
                                                  var jsonstr = "";
                                                  for (var i = 0; i < payload.length; i++) {
                                                      jsonstr += String.fromCharCode(payload[i]);
                                                  }
                                                  //console.log("RECV PACKET WITH DATA "+jsonstr+" to "+JSON.stringify(src));
                                                  payload = JSON.parse(jsonstr);
                                                  if (payload) {
                                                      if (payload.msg == "delete") {
                                                          Kata.log("Disconnecting "+args.visual+"...");
                                                          thus.mPresence.setVisual("");
                                                          thus._disconnect(thus.mPresence);
                                                      }
                                                      if (payload.msg == "physics") {
                                                          Kata.log("Set physics for "+args.visual+"...");
                                                          var pres = thus.mPresence;
                                                          pres.setPhysics(payload.data);
                                                          pres.setLocation(
                                                              {rotaxis: [1,0,0],
                                                               rotvel: 0,
                                                               vel: [0,0,0],
                                                               time: Kata.now(pres.space())});
                                                          pres.setPhysics(payload.data);
                                                      }
                                                  }
                                              });
                             Kata.log("Connected subobject "+args.visual+"\n");
                         }
                         // Start periodic movemenst
                         //thus.move();
                     });
    };
    
    Kata.extend(Example.ObjectScript, SUPER);
    Example.ObjectScript.kMovePort=61827;
    Example.ObjectScript.kMsgPort=61829;
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
