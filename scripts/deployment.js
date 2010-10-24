/** This file contains deployment-specific configuration for the chat
 *  page. Ideally, everything that needs to be modified to make this
 *  run on different servers is isolated to this file.
 */

SpaceURL = "loop://localhost";
//SpaceURL = "sirikata://localhost:7777";

Avatars = [
    {
        name : "Big Box",
        url : document.URL + "bigbox.dae",
        preview : document.URL + "_Cube.jpg"
    },
    {
        name : "Big Box",
        url : document.URL + "bigbox2.dae",
        preview : document.URL + "_Cube.jpg"
    }
];