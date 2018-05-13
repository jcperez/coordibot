#!/bin/sh
echo "###### Starting Deployment ######"
ls -all
echo "###### Installing modules ######"
npm install
echo "###### Installing Typescript ######"
npm install -g typescript
echo "###### Compiling Typescript ######"
tsc
echo "###### Removing dev dependencies ######"
npm prune --production
echo "###### Zip the package ######"
zip -r Lambda.zip .  -i "*.js" "*.json" > /dev/null
echo "###### List files ######"
ls -all
echo "###### Deploy to lambda ######"
aws lambda update-function-code --function-name RetrieveAvailability --zip-file fileb://Lambda.zip > /dev/null

