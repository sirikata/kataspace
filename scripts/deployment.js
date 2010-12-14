/** This file contains deployment-specific configuration for the chat
 *  page. Ideally, everything that needs to be modified to make this
 *  run on different servers is isolated to this file.
 */

// Replace to override the default of using the sirikata protocol on
// the same host on Sirikata's default port of 7777
SpaceURL = "sirikata://" + window.location.hostname + ":7777";

Title = "KataSpace";

(function(){
var dirname = window.location.href.substr(0,
                  window.location.href.lastIndexOf('/')+1);

Avatars = [
    {
        name : "Male",
        url : dirname + "static/maleWalkIdleSit.dae",
        scale : 1.0,
        preview : dirname + "static/maleheadshot.png"
    },
    {
        name : "Female",
        url : dirname + "static/femaleWalkIdleSit.dae",
        scale : 1.0,
        preview : dirname + "static/femaleheadshot.png"
    }
];

})();
