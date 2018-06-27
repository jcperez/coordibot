import * as config from "config";
import * as _ from "lodash";
import * as moment from "moment";

import { availableCalendars, IUserEvent, retrieveUserEvents } from "../adapters/gcalendar";
import { DATE_FORMAT } from "../constants";
import { interviewers } from "../interviewers";
import { detectEventConflict, nextDay } from "../util/calendarUtils";
import { eventMatching, sortStrings } from "../util/utils";
import { isDurationAllowed } from "../validations";

const keywords: string[] = config.get("EVENT_NAME");

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getName = (calendarId: string) => {
  try {
    const username = calendarId.split("@")[0];
    return username.split("\.").map(capitalizeFirstLetter).join(" ");
  } catch (ex) {
    console.log(ex);
    return calendarId;
  }
};

const interviewersAvailability = async (startDate: string, endDate?: string) => {
  const payload = {
    endDate: endDate || nextDay(startDate),
    startDate,
  };

  console.log(`Retrieving availability: ${payload.startDate} to ${payload.endDate}`);

  const calendars = await availableCalendars(payload);
  const calendarIds: string[] = calendars.map((calendar: any) => calendar.id);

  const availability = {};

  const interviewersSlots: IUserEvent[][] = await Promise.all(interviewers.map((interviewer) => {
    if (calendarIds.indexOf(interviewer) > -1) {
      return retrieveUserEvents(interviewer, payload)
        .catch((err) => []);
    }
    console.log(`Skipping ${interviewer}. Service doesn't have access to this calendar.`);
    return Promise.resolve([]);
  }));

  for (const allSlots of interviewersSlots) {
    let slots: IUserEvent[] = [];
    slots = allSlots.filter((event: IUserEvent) => eventMatching(keywords, event.summary));
    slots = slots.filter((slot) => slot.creator === slot.calendarId);

    for (const slot of slots) {
      const date = moment(slot.start);
      const end = moment(slot.end);
      const day = date.format(DATE_FORMAT);

      if (!availability[day]) {
        availability[day] = [];
      }

      // Add warnings to the slots
      if (!isDurationAllowed(slot)) {
        slot.warnings.push("Event duration is less than 90 mins");
      }

      const conflictEvents = detectEventConflict(slot, allSlots);
      if (conflictEvents.length > 0) {
        let conflictMessage = `Slot has a conflict with \`${conflictEvents[0].summary}\``;
        if (conflictEvents.length > 1) {
          conflictMessage += ` and ${conflictEvents.length - 1} other event${conflictEvents.length > 1 ? "(s)" : ""}.`;
        }
        slot.warnings.push(conflictMessage);
      }

      slot.message = `*${date.format("HH:mm")} to ${end.format("HH:mm")}* - ${getName(slot.calendarId)}`;

      if (slot.warnings.length) {
        for (const warning of slot.warnings) {
          slot.message += `\n - ${warning}`;
        }
      }
      slot.message += "\n";
      availability[day].push(slot);
    }
  }

  const keys = _.keys(availability);
  for (const day in keys) {
    availability[keys[day]].sort(sortStrings);
  }

  return availability;
};

export { interviewersAvailability };
