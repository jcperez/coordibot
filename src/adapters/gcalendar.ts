import { google } from "googleapis";
import * as _ from "lodash";
import * as moment from "moment";

import { privateKey } from "../client_secret";

const calendar = google.calendar("v3");

const jwtClient = new google.auth.JWT(
  privateKey.client_email,
  undefined,
  privateKey.private_key,
  ["https://www.googleapis.com/auth/calendar"],
);

interface ICalendarError {
  code: string;
  response: {
    statusText: string,
  };
}

interface ICalendarResponse {
  data: {
    items: ICalendarEvent[],
  };
}

interface ICalendarEvent {
  start: {
    dateTime: string,
  };
  end: {
    dateTime: string,
  };
  summary: string;
  creator: {
    email: string,
  };
}

interface IUserEvent {
  start: string;
  end: string;
  summary: string;
  calendarId: string;
  message?: string;
  warnings: string[];
  creator: string;
}

interface IRetrieveEventsOptions {
  startDate: string;
  endDate: string;
  query?: string;
}

const mapUserEvent = (user: string, event: ICalendarEvent): IUserEvent => {
  return {
    calendarId: user,
    creator: _.get(event, "creator.email", ""),
    end: event.end.dateTime,
    start: event.start.dateTime,
    summary: event.summary,
    warnings: [],

  };
};

const retrieveUserEvents = async (user: string, options: IRetrieveEventsOptions): Promise<IUserEvent[]> => {
  console.log(`Retrieving availability for ${user}`);
  return new Promise ((resolve: (value: IUserEvent[]) => void, reject: any) => {
    calendar.events.list({
      auth: jwtClient,
      calendarId: user,
      q: options.query,
      singleEvents: true,
      timeMax: moment(options.endDate).toISOString(),
      timeMin: moment(options.startDate).toISOString(),
    }, (err: ICalendarError, response: ICalendarResponse) => {
      console.log(`Getting response from ${user}`);
      if (err) {
        console.log(`Error retrieving information from ${user} ${err}`);
        reject([]);
      } else {
        const events: ICalendarEvent[] = response.data.items || [];
        resolve(events.map((event) => mapUserEvent(user, event)));
      }
    });
  });
};

const availableCalendars = async (options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    calendar.calendarList.list({
      auth: jwtClient,
    }, (err: ICalendarError, response: any) => {
      if (err) {
        console.log(err);
        return reject([]);
      }

      const calendars = response.data.items.map((c: any) => {
        return {
          id: c.id,
          timezone: c.timeZone,
        };
      });
      return resolve(calendars);
    });
  });
};

export {
  availableCalendars,
  retrieveUserEvents,
  IUserEvent,
  ICalendarEvent,
  IRetrieveEventsOptions,
  ICalendarResponse,
  ICalendarError,
};
