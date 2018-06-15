import * as moment from "moment";

import { IUserEvent } from "../adapters/gcalendar";
import { DATE_FORMAT } from "../constants";

const detectEventConflict = (event: IUserEvent, events: IUserEvent[]): IUserEvent[] => {
  const start = moment(event.start);
  const end = moment(event.end);

  return events.filter((conflictingEvent) => {
    if (conflictingEvent.summary === event.summary) {
      return false;
    }
    const cs = moment(conflictingEvent.start);
    const ce = moment(conflictingEvent.end);
    return start.isBetween(cs, ce, "minutes", "[)") || end.isBetween(cs, ce, "minutes", "(]") ||
          (cs.isBetween(start, end, "minutes", "[]") && ce.isBetween(start, end, "minutes", "[]"));
  });
};

const today = (): string => {
  return moment().format(DATE_FORMAT);
};

const nextDay = (date?: string): string => {
  return moment(date).add(1, "day").format(DATE_FORMAT);
};

export { detectEventConflict, today, nextDay };
