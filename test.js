const test = require('./dist/index');

test.displayHelpSectionHandler({
  "messageVersion": "1.0",
  "invocationSource": "FulfillmentCodeHook",
  "userId": "abebdb16-4a77-4a89-b5c1-a9d9af667e36:T024QJSEN:U7MS9HXNU",
  "sessionAttributes": {},
  "bot": {
    "name": "CoordinatorBot",
    "alias": "$LATEST",
    "version": "$LATEST"
  },
  "outputDialogMode": "Text",
  "currentIntent": {
    "name": "ScheduleInterview",
    "slots": {
      "interviewDate": "2018-04-25",
      "reference": "2018-W17"
    },
    "confirmationStatus": "None"
  }
}, null, (err, param) => console.log(param));
