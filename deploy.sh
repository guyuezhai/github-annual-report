#!/usr/bin/env sh

set -e

yarn build
git add .
git commit -m 'deploy'
git push origin master
