/** This file contains deployment-specific configuration for the chat
 *  page. Ideally, everything that needs to be modified to make this
 *  run on different servers is isolated to this file.
 */

SpaceURL = "loop://localhost";
//SpaceURL = "sirikata://localhost:7777";

Title = "KataSpace";

Avatars = [
    {
        name : "Big Red Box",
        url : document.URL + "red.dae",
        scale : 1.0,
        preview : document.URL + "red.jpg"
    },
    {
        name : "Small Blue Box",
        url : document.URL + "blue.dae",
        scale : 0.3,
        preview : document.URL + "blue.jpg"
    }
];