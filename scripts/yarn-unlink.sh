#!/bin/bash

# always run from root dir (the parent dir of this script)
cd "$(dirname "$0")/.."

yarn unlink @luvio/engine
yarn unlink @luvio/environments
yarn unlink @luvio/compiler
yarn unlink @luvio/adapter-test-library
yarn unlink @luvio/lwc-luvio

./node_modules/.bin/lerna exec -- yarn unlink @luvio/engine
./node_modules/.bin/lerna exec -- yarn unlink @luvio/environments
./node_modules/.bin/lerna exec -- yarn unlink @luvio/compiler
./node_modules/.bin/lerna exec -- yarn unlink @luvio/adapter-test-library
./node_modules/.bin/lerna exec -- yarn unlink @luvio/lwc-luvio