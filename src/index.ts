import * as config from "config";
import * as _ from "lodash";
import * as moment from "moment";

import { Callback, Context } from "aws-lambda";

import { availableCalendars, IUserEvent, retrieveUserEvents } from "./adapters/gcalendar";
import { DATE_FORMAT, WEEK_DATE_FORMAT } from "./constants";
import { interviewers } from "./interviewers";
import { genericLambdaHandler, sendMessageToClient } from "./lambda";
import { retrieveUserInformation } from "./users";
import { detectEventConflict, nextDay, today } from "./util/calendarUtils";
import { eventMatching, sortStrings } from "./util/utils";
import { isDurationAllowed } from "./validations";

const keywords: string[] = config.get("EVENT_NAME");

const formatTestResponse = (calendars: any[]): string => {
  const calendarIds = calendars.map((calendar) => calendar.id);
  let answer = "";
  for (const calendar of calendarIds) {
    if (interviewers.indexOf(calendar) !== -1) {
      answer += `${calendar} - OK\n`;
    }
  }
  for (const interviewer of interviewers) {
    if (calendarIds.indexOf(interviewer) === -1) {
      answer += `${interviewer} - Waiting for access to calendar\n`;
    }
  }
  return answer;
};

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
          conflictMessage += ` and ${conflictEvents.length - 1} other event ${conflictEvents.length > 1 ? "(s)" : ""}.`;
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

// --------------- Dispatchers -----------------------
async function dispatchAvailability(intentRequest: any, callback: any) {
  const sessionAttributes = intentRequest.sessionAttributes;
  const slots = intentRequest.currentIntent.slots;
  const interviewDate = slots.interviewDate;

  const availability = await interviewersAvailability(interviewDate);

  let answer = "";

  const keys = _.keys(availability);
  for (const day in keys) {
    const k = keys[day];
    answer += `Availability for ${moment(k).format("dddd ll")}:\n\n`;
    for (const slot of availability[k]) {
      answer += `${slot.message}\n`;
    }
  }

  if (!answer) {
    answer = `There is no available slots on ${interviewDate}.`;
  }

  callback(sendMessageToClient(answer, sessionAttributes));
}

async function dispatchStats(intentRequest: any, callback: any) {
  const sessionAttributes = intentRequest.sessionAttributes;
  const slots = intentRequest.currentIntent.slots;

  const date = slots.reference;

  // Validate string to be a ISO 8601 week date
  const week = moment(date, WEEK_DATE_FORMAT, true);
  let answer = "";

  if (!week.isValid()) {
    answer = "I cannot process your request. Say something like `stats this week` or `stats next week`";
  } else {
    const startWeek = moment(date);
    const endWeek = moment(date).add(5, "days");

    const availability = await interviewersAvailability(startWeek.format(DATE_FORMAT), endWeek.format(DATE_FORMAT));

    const keys = _.keys(availability);
    let minutes = 0;
    const messages: string[] = [];
    for (const day in keys) {
      const k = keys[day];
      let dayAvailability = 0;
      for (const slot of availability[k]) {
        dayAvailability += moment.duration(moment(slot.end).diff(moment(slot.start))).asMinutes();
      }
      minutes += dayAvailability;
      messages.push(`${k}: ${Number(dayAvailability / 60).toFixed(2)} hours`);
    }

    // tslint:disable-next-line
    answer += `${messages.sort().join("\n")}\n---------------------\nYou have ${Number(minutes / 60).toFixed(2)} hours available between ${startWeek.format("MMM D")} and ${endWeek.add(-1, "days").format("MMM D")}.`;
  }

  callback(sendMessageToClient(answer, sessionAttributes));
}

async function dispatchTest(event: any, callback: any) {
  const sessionAttributes = event.sessionAttributes;

  const payload = {
    endDate: nextDay(),
    startDate: today(),
  };

  const calendars = await availableCalendars(payload);
  const answer = formatTestResponse(calendars);

  callback(sendMessageToClient(answer, sessionAttributes));
}

async function dispatchHelpSection(event: any, callback: any) {
  const sessionAttributes = event.sessionAttributes;

  const user = await retrieveUserInformation(event.userId);
  const userName = user.profile.real_name_normalized.split(" ")[0];

  const answer = `Hello ${userName}!

  My name is ${config.get("BOT_SLACK_HANDLER")}.

  To retrieve available spots for interviews, just send me a message saying \`check\` and the date.
  For example: \`check tomorrow\`, \`check next Monday\`, or \`check June 20\`
  `;

  callback(sendMessageToClient(answer, sessionAttributes));
}

async function dispatchTechnicalInformation(event: any, callback: any) {
  const sessionAttributes = event.sessionAttributes;
  const answer = `BOT_SLACK_HANDLER: ${config.get("BOT_SLACK_HANDLER")}`;
  callback(sendMessageToClient(answer, sessionAttributes));
}

// --------------- Handlers -----------------------
const retrieveAvailabilityHandler = (event: any, context: Context | null, callback: Callback) => {
  genericLambdaHandler(event, context, callback, dispatchAvailability);
};

const testRetrieveAvailabilityHandler = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, dispatchTest);
};

const retrieveStatisticsHandler = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, dispatchStats);
};

const displayHelpSectionHandler = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, dispatchHelpSection);
};

const displayTechnicalInformation = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, dispatchTechnicalInformation);
};

const mainHandler = (event: any, context: Context | null, callback: Callback): void => {
  const intentName = event.currentIntent.name;

  switch (intentName) {
    case "ScheduleInterview":
      return retrieveAvailabilityHandler(event, context, callback);
    case "AvailabilityStats":
      return retrieveStatisticsHandler(event, context, callback);
    case "TestConnection":
      return testRetrieveAvailabilityHandler(event, context, callback);
    case "Help":
      return displayHelpSectionHandler(event, context, callback);
    default:
      console.log(`Could not handle ${intentName}. Default handler invoked.`);
      return displayHelpSectionHandler(event, context, callback);
  }
};

export {
  retrieveAvailabilityHandler,
  testRetrieveAvailabilityHandler,
  retrieveStatisticsHandler,
  displayHelpSectionHandler,
  mainHandler,
  displayTechnicalInformation,
};
