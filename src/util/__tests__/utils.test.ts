import * as moment from "moment";
import * as Utils from "../utils";

import { IUserEvent } from "../../adapters/gcalendar";

describe("Tests", () => {
  beforeAll(() => {
    console.error = () => {};
    console.log = () => {};
  });

  test("Test sort string function", async () => {
    const a: IUserEvent = {
      calendarId: "juan.carlos@wizeline.com",
      creator: "juan.carlos@wizeline.com",
      end: moment().format("YYYY-MM-DD"),
      message: "10 to 15",
      start: moment().format("YYYY-MM-DD"),
      summary: "Hold",
      warnings: [],
    };

    const b: IUserEvent = {
      calendarId: "juan.carlos@wizeline.com",
      creator: "juan.carlos@wizeline.com",
      end: moment().format("YYYY-MM-DD"),
      message: "12 to 17",
      start: moment().format("YYYY-MM-DD"),
      summary: "Hold",
      warnings: [],
    };

    const c: IUserEvent = {
      calendarId: "juan.carlos@wizeline.com",
      creator: "juan.carlos@wizeline.com",
      end: moment().format("YYYY-MM-DD"),
      message: "10 to 15",
      start: moment().format("YYYY-MM-DD"),
      summary: "Hold",
      warnings: [],
    };

    const d: IUserEvent = {
      calendarId: "juan.carlos@wizeline.com",
      creator: "juan.carlos@wizeline.com",
      end: moment().format("YYYY-MM-DD"),
      start: moment().format("YYYY-MM-DD"),
      summary: "Hold",
      warnings: [],
    };

    expect(Utils.sortStrings(a, b)).toBe(-1);
    expect(Utils.sortStrings(a, c)).toBe(0);
    expect(Utils.sortStrings(a, d)).toBe(0);
    return expect(Utils.sortStrings(b, a)).toBe(1);
  });
});
