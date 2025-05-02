#!/bin/bash

mkdir -p ./openmcp-sdk
rm -rf ./openmcp-sdk/
mkdir -p ./openmcp-sdk

(cd ./renderer && npm run build && mv ./dist ../openmcp-sdk/renderer) &
(cd ./service && npm run build && mv ./dist ../openmcp-sdk/service) &

wait

mkdir -p ./software/openmcp-sdk
rm -rf ./software/openmcp-sdk
cp -r ./openmcp-sdk ./software/

echo "finish building services in ./openmcp-sdk"
