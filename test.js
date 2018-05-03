const test = require('./dist/index');

test.retrieveAvailabilityHandler({
  "messageVersion": "1.0",
  "invocationSource": "FulfillmentCodeHook",
  "userId": "user-1",
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
