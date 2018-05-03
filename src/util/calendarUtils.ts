import * as moment from 'moment';

import { UserEvent } from '../adapters/gcalendar';

const detectEventConflict = (event:UserEvent, events: Array<UserEvent>): Array<UserEvent> => {
  const start = moment(event.start);
  const end = moment(event.end);
  events.filter
  return events.filter((conflictingEvent) => {
    if (conflictingEvent.summary === event.summary) {
      return false;
    }
    const cs = moment(conflictingEvent.start);
    const ce = moment(conflictingEvent.end);
    return start.isBetween(cs, ce, "minutes", '[)') || end.isBetween(cs, ce, "minutes", '(]') ||
          (cs.isBetween(start, end, "minutes", '[]') && ce.isBetween(start, end, "minutes", "[]"));
  });
}

export { detectEventConflict };
