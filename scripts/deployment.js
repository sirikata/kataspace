/** This file contains deployment-specific configuration for the chat
 *  page. Ideally, everything that needs to be modified to make this
 *  run on different servers is isolated to this file.
 */

SpaceURL = "loop://localhost";
//SpaceURL = "sirikata://localhost:7777";

Avatars = [
    {
        name : "Big Box Red",
        url : document.URL + "red.dae",
        preview : document.URL + "red.jpg"
    },
    {
        name : "Big Box Blue",
        url : document.URL + "blue.dae",
        preview : document.URL + "blue.jpg"
    }
];