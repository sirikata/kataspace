#!/usr/bin/python
#Copyright (c) 2010, Katalabs, Inc.
#all rights reserved

#utility to combine animations from separate collada files into a set of
#animation clips.  Assumes identical mesh and animation structure.
#
#Usage:
#py mashAnimations file1.dae file2.dae [file3.dae...] outfile.dae
#
#file1 is the template file2 etc are used only for their precious animations

"""
---structure:
library_animations
    animation
        source input
        source output
        source interpolation
        sampler
        channel

some files have a bunch of little animations for each joint
others have one animation with a series of sources, samplers, and channels, each corresponding to a joint
"""

import sys, time, os
import os.path as path
from walkTagTree import *

def process(xmls):
    doc1 = xmls[0]
    libanim=doc1.getElementsByTagName("library_animations")[0]
    anims=libanim.getElementsByTagName("animation")

    cliplist = []    
    clips=doc1.createElement("library_animation_clips")
    for i in range(1, 1+len(xmls)):
        clip=doc1.createElement("animation_clip")
        clip.setAttribute("id","anim" + str(i))
        cliplist.append(clip)
        clips.appendChild(clip)
    libanim.parentNode.insertBefore(clips,libanim)

    for i in range(len(anims)):
        print anims[i].getAttribute("id")
        anims[i].setAttribute("id",anims[i].getAttribute("id")+"_anim1")
        animinstance=doc1.createElement("instance_animation")
        animinstance.setAttribute("url","#"+anims[i].getAttribute("id"))
        cliplist[0].appendChild(animinstance)

    for n in range(1, len(xmls)):
        doc = xmls[n]
        namext = "_anim" + str(n+1)
        libanim2=doc.getElementsByTagName("library_animations")[0]
        anims=libanim2.getElementsByTagName("animation")
        for i in range(len(anims)):
            newnode=anims[i].cloneNode(True)
            subtags=newnode.getElementsByTagName("*")
            for j in range(len(subtags)):
                if(subtags[j].hasAttribute("id")):
                    subtags[j].setAttribute("id",subtags[j].getAttribute("id")+namext)
                if(subtags[j].hasAttribute("source")):
                    subtags[j].setAttribute("source",subtags[j].getAttribute("source")+namext)
                    
            newnode.setAttribute("id",newnode.getAttribute("id")+namext)
            libanim.appendChild(newnode)
            animinstance=doc1.createElement("instance_animation")
            animinstance.setAttribute("url","#"+newnode.getAttribute("id"))
            cliplist[n].appendChild(animinstance)
            print newnode.getAttribute("id")

if __name__=="__main__":
    from xml.dom import minidom
    import codecs
    if len(sys.argv) < 2:
        print "usage: python mashAnimations file1.dae file2.dae [file3.dae...] outfile.dae"
        exit()
    files = sys.argv[1:-1]
    fout = sys.argv[-1]
    xmls = []
    for fin in files:
        f = codecs.open(fin, "r", "utf-8")
        s = f.read().encode("utf-8")
        f.close()
        x = minidom.parseString(s)
        xmls.append(x)
    process(xmls)
##    xx = xmls[0].toprettyxml()
    xx = xmls[0].toxml()
    f = codecs.open(fout,'w','utf-8')
    f.write(xx)
    f.close()
