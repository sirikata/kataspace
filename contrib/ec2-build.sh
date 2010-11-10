#!/bin/bash
#
# This script will grab and build all the components needed to deploy
# Kataspace on EC2 from a base *Ubuntu* image (the base Linux image
# provided by Amazon is not supported).

DIR=`pwd`
GITHUB_USER=$1

# Install dependencies for Sirikata space server, including god for
# ensuring the server stays alive
sudo apt-get install -y \
git-core cmake sed unzip zip automake1.9 jam g++ \
libzzip-dev autoconf libtool bison patch \
gperf subversion libtool ruby libgsl0-dev \
libssl-dev libbz2-dev god

# Install dependencies for KataSpace/KataJS, including web
# server. protojs requires java to build unfortunately.
sudo apt-get install -y lighttpd default-jre

# Check out and build Sirikata space server
git clone git://github.com/sirikata/sirikata.git sirikata.git
cd sirikata.git
make minimal-depends
cd build/cmake
cmake -DCMAKE_BUILD_TYPE=Release .
make space tcpsst servermap-tabular core-local weight-exp weight-sqr weight-const space-local space-standard

# Checkout and "build" Kataspace
cd ${DIR}
# Note that this is currently private, so you need to specify your GitHub user account
git clone https://${GITHUB_USER}@github.com/katalabs/kataspace.git kataspace.git
cd kataspace.git
make
