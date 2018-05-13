import * as Coordibot from '../index';
import * as moment from 'moment';

jest.mock('../adapters/gcalendar');

describe('Tests', () => {
  beforeAll(() => {
    console.error = () => {};
    console.log = () => {};
  });

  test('Test retrieve availability', async () => {
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
    expect(response.dialogAction.message.content).toContain("*14:00 to 15:00*");
    expect(response.dialogAction.message.content).toContain("Event duration is less than 90 mins");
    return expect(response.dialogAction.message.content).toContain("*10:00 to 12:00*");
  });

  test('Test connection checker', async () => {
    const connectionTest = () => {
      return new Promise((resolve) => {
        Coordibot.testRetrieveAvailabilityHandler({
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
            "confirmationStatus": "None"
          }
        }, null, (err: any, param: any) => {
          resolve(param);
        });
      });
    };

    const response: any = await connectionTest();
    return expect(response.dialogAction.message.content).toContain("juan.carlos@wizeline.com - OK");
  });
});
