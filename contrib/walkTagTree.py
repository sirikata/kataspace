#routine digs into xml by first tag in tree; returns None if fail
def walkTagTree(x, tree):
    for t in tree:
        tags = x.getElementsByTagName(t)
        if not tags:
            return None
        x = tags[0]
    return x

#this version returns list instead of last tag[0]
def walkTagTree2(x, tree):
    for t in tree:
        tags = x.getElementsByTagName(t)
        if not tags:
            return None
        x = tags[0]
    return tags

def getChildrenByTag(x, t):
    c = []
    s = x.firstChild
    while s:
        if s.nodeName == t:
            c.append(s)
        s = s.nextSibling
    return c

#flat walk; just children, no recursion
def walkTagTreeFlat(x, tree):
    for t in tree:
        tags = getChildrenByTag(x, t)
        if not tags:
            return None
        x = tags[0]
    return x

def walkTagTreeFlat2(x, tree):
    for t in tree:
        tags = getChildrenByTag(x, t)
        if not tags:
            return None
        x = tags[0]
    return tags
