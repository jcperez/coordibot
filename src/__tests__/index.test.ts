import * as moment from "moment";
import * as Coordibot from "../index";

jest.mock("../adapters/gcalendar");

describe("Handlers", () => {
  beforeAll(() => {
    console.error = () => {};
    console.log = () => {};
  });

  test("Retrieve availability", async () => {
    const availabilityTest = (date: string) => {
      return new Promise((resolve) => {
        Coordibot.retrieveAvailabilityHandler({
          messageVersion: "1.0",
          invocationSource: "FulfillmentCodeHook",
          userId: "user-1",
          sessionAttributes: {},
          bot: {
            name: "CoordinatorBot",
            alias: "$LATEST",
            version: "$LATEST",
          },
          outputDialogMode: "Text",
          currentIntent: {
            name: "ScheduleInterview",
            slots: {
              interviewDate: date,
            },
            confirmationStatus: "None",
          },
        }, null, (err: any, param: any) => {
          resolve(param);
        });
      });
    };

    const today = moment(1527200000000).format("YYYY-MM-DD");
    const response: any = await availabilityTest(today);
    return expect(response).toMatchSnapshot();
  });

  test("Connection checker", async () => {
    const connectionTest = () => {
      return new Promise((resolve) => {
        Coordibot.testRetrieveAvailabilityHandler({
          messageVersion: "1.0",
          invocationSource: "FulfillmentCodeHook",
          userId: "user-1",
          sessionAttributes: {},
          bot: {
            name: "CoordinatorBot",
            alias: "$LATEST",
            version: "$LATEST",
          },
          outputDialogMode: "Text",
          currentIntent: {
            name: "ScheduleInterview",
            confirmationStatus: "None",
          },
        }, null, (err: any, param: any) => {
          resolve(param);
        });
      });
    };

    const response: any = await connectionTest();
    return expect(response).toMatchSnapshot();
  });
});
