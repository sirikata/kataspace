
if (typeof(URL) === "undefined") {
    URL = {};
}

/** Checks if a given string looks URL-ish. */
URL.isURL = function(str) {
    var has_protocol = (str.indexOf('://') != -1);
    var has_known_tld =
        (str.indexOf('.com') != -1) ||
        (str.indexOf('.net') != -1) ||
        (str.indexOf('.edu') != -1);

    return (has_protocol || has_known_tld);
};

/** "Normalizes" a URL to make it safe within any context. This means fixing up.
 *  URLs that aren't properly formed so they don't try to work relatively, 
 *  i.e. so google.com becomes http://google.com so clicking it wouldn't go to
 *  http://yourserver.net/google.com.
 */
URL.normalize = function(str) {
    if (str.indexOf('://') != -1) return str;
    return 'http://' + str;
};

/** Tries to detect links embedded in the given string and replace them with
  * links.
  */
URL.convertURLsToLinks = function(str, newtab) {
    var newtab_str = '';
    if (newtab)
        newtab_str = ' target="_blank"';

    // Get parts of string to test
    var parts = str.split(' ');
    for(var i = 0; i < parts.length; i++)
        parts[i] = parts[i].trim();
    // Generate set of replacements. Note we use a map here in case of duplicates
    var to_replace = {};
    for(var i = 0; i < parts.length; i++)
        if (URL.isURL(parts[i]))
            to_replace[parts[i]] = parts[i];
    // Now, run through and do replacements
    for(var rep in to_replace)
        str = str.replace(rep, '<a href="' + URL.normalize(rep) + '"' + newtab_str + '>' + rep + '</a>');
    return str;
};
