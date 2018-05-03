#!/bin/sh
echo "###### Starting Deployment ######"
ls -all
npm install
npm install -g typescript
tsc
