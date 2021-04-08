#!/bin/bash

# always run from root dir (the parent dir of this script)
cd "$(dirname "$0")/.."

yarn link @luvio/engine
yarn link @luvio/environments
yarn link @luvio/compiler
yarn link @luvio/adapter-test-library
yarn link @luvio/lwc-luvio

./node_modules/.bin/lerna exec -- yarn link @luvio/engine
./node_modules/.bin/lerna exec -- yarn link @luvio/environments
./node_modules/.bin/lerna exec -- yarn link @luvio/compiler
./node_modules/.bin/lerna exec -- yarn link @luvio/adapter-test-library
./node_modules/.bin/lerna exec -- yarn link @luvio/lwc-luvio