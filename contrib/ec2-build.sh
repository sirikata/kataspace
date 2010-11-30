#!/bin/bash
#
# This script will grab and build all the components needed to deploy
# Kataspace on EC2 from a base *Ubuntu* image (the base Linux image
# provided by Amazon is not supported).

DIR=`pwd`

# Install dependencies for Sirikata space server
sudo apt-get install -y \
git-core cmake sed unzip zip automake1.9 jam g++ \
libzzip-dev autoconf libtool bison patch \
gperf subversion libtool ruby libgsl0-dev \
libssl-dev libbz2-dev

# Install dependencies for KataSpace/KataJS, including web
# server. protojs requires java to build unfortunately.
sudo apt-get install -y lighttpd default-jre

# Install the god gem manually. The version in ubuntu is ancient.
sudo apt-get install -y ruby1.8-dev rubygems
sudo gem install god

# Check out and build Sirikata space server
git clone git://github.com/sirikata/sirikata.git sirikata.git
cd sirikata.git
make minimal-depends
cd build/cmake
cmake -DCMAKE_BUILD_TYPE=Release .
make space tcpsst servermap-tabular core-local weight-exp weight-sqr weight-const space-local space-standard

# Checkout and "build" Kataspace
cd ${DIR}
git clone git://github.com/sirikata/kataspace.git kataspace.git
cd kataspace.git
make
