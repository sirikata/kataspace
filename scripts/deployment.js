/** This file contains deployment-specific configuration for the chat
 *  page. Ideally, everything that needs to be modified to make this
 *  run on different servers is isolated to this file.
 */

SpaceURL = "loop://localhost";
//SpaceURL = "sirikata://localhost:7777";

Title = "KataSpace";

(function(){
var dirname = window.location.href.substr(0,
                  window.location.href.lastIndexOf('/')+1);

Avatars = [
    {
        name : "Big Red Box",
        url : dirname + "static/red.dae",
        scale : 1.0,
        preview : dirname + "static/red.jpg"
    },
    {
        name : "Small Blue Box",
        url : dirname + "static/blue.dae",
        scale : 0.3,
        preview : dirname + "static/blue.jpg"
    }
];

})();
