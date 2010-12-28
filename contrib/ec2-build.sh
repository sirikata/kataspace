#!/bin/bash
#
# This script will grab and build all the components needed to deploy
# Kataspace on EC2 from a base *Ubuntu* image (the base Linux image
# provided by Amazon is not supported).

DIR=`pwd`

# Bail out with a message for the user
function bail {
    echo $1
    exit -1
}

# Install dependencies for Sirikata space server
sudo apt-get install -y \
git-core cmake sed unzip zip automake1.9 jam g++ \
libzzip-dev autoconf libtool bison patch \
gperf subversion libtool ruby libgsl0-dev \
libssl-dev libbz2-dev || \
bail "Couldn't install required base system packages."

# Install dependencies for KataSpace/KataJS, including web
# server. protojs requires java to build unfortunately.
sudo apt-get install -y lighttpd default-jre || \
bail "Couldn't install required lighttpd system packages."

# Install the god gem manually. The version in ubuntu is ancient.
sudo apt-get install -y ruby1.8-dev rubygems || \
bail "Couldn't install required ruby system packages."
sudo gem install god || \
bail "Couldn't install god."

# Check out and build Sirikata space server
git clone git://github.com/sirikata/sirikata.git sirikata.git && \
cd sirikata.git && \
make minimal-depends && \
cd build/cmake && \
cmake -DCMAKE_BUILD_TYPE=Release . && \
make space tcpsst servermap-tabular core-local weight-exp weight-sqr weight-const space-local space-standard || \
bail "Couldn't build space server."

# Checkout and "build" Kataspace
cd ${DIR} && \
git clone git://github.com/sirikata/kataspace.git kataspace.git && \
cd kataspace.git && \
make || \
bail "Couldn't build kataspace."
