import * as Coordibot from '../index';
import * as moment from 'moment';

jest.mock('../adapters/gcalendar');

describe('Tests', () => {
  beforeAll(() => {
    console.error = () => {};
    console.log = () => {};
  });

  test('This is a basic test', async () => {
    const availabilityTest = (date:string) => {
      return new Promise((resolve) => {
        Coordibot.retrieveAvailabilityHandler({
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
              "interviewDate": date
            },
            "confirmationStatus": "None"
          }
        }, null, (err: any, param: any) => {
          resolve(param);
        });
      });
    };

    const today = moment().format('YYYY-MM-DD');
    const response: any = await availabilityTest(today);
    expect(response.dialogAction.message.content).toContain(`Availability for ${today}:`);
    return expect(response.dialogAction.message.content).toContain("*00:00 to 00:00*");
  });
});
