import * as moment from "moment";

import { UserEvent } from "./adapters/gcalendar";

const isDurationAllowed = (event: UserEvent, minimumDuration: number = 90): boolean => {
  const start = moment(event.start);
  const end = moment(event.end);

  const duration = moment.duration(end.diff(start));
  return duration.asMinutes() >= minimumDuration;
};

export {
  isDurationAllowed,
};
