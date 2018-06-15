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

interface CalendarError {
  code: string;
  response: {
    statusText: string,
  };
}

interface CalendarResponse {
  data: {
    items: CalendarEvent[],
  };
}

interface CalendarEvent {
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

interface UserEvent {
  start: string;
  end: string;
  summary: string;
  calendarId: string;
  message?: string;
  warnings: string[];
  creator: string;
}

interface RetrieveEventsOptions {
  startDate: string;
  endDate: string;
  query?: string;
}

const mapUserEvent = (user: string, event: CalendarEvent): UserEvent => {
  return {
    start: event.start.dateTime,
    end: event.end.dateTime,
    summary: event.summary,
    calendarId: user,
    warnings: [],
    creator: _.get(event, "creator.email", ""),
  };
};

const retrieveUserEvents = async (user: string, options: RetrieveEventsOptions): Promise<UserEvent[]> => {
  console.log(`Retrieving availability for ${user}`);
  return new Promise ((resolve: (value: UserEvent[]) => void, reject: any) => {
    calendar.events.list({
      auth: jwtClient,
      calendarId: user,
      timeMin: moment(options.startDate).toISOString(),
      timeMax: moment(options.endDate).toISOString(),
      singleEvents: true,
      q: options.query,
    }, function(err: CalendarError, response: CalendarResponse) {
      console.log(`Getting response from ${user}`);
      if (err) {
        console.log(`Error retrieving information from ${user} ${err}`);
        reject([]);
      } else {
        const events: CalendarEvent[] = response.data.items || [];
        resolve(events.map((event) => mapUserEvent(user, event)));
      }
    });
  });
};

const availableCalendars = async (options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    calendar.calendarList.list({
      auth: jwtClient,
    }, function(err: CalendarError, response: any) {
      if (err) {
        console.log(err);
        return reject([]);
      }

      const calendars = response.data.items.map((calendar: any) => {
        return {
          id: calendar.id,
          timezone: calendar.timeZone,
        };
      });
      return resolve(calendars);
    });
  });
};

export { availableCalendars, retrieveUserEvents, UserEvent, CalendarEvent, RetrieveEventsOptions, CalendarResponse, CalendarError };
