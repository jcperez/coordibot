import * as config from "config";
import * as _ from "lodash";
import * as moment from "moment";

import { availableCalendars } from "../adapters/gcalendar";
import { DATE_FORMAT, WEEK_DATE_FORMAT } from "../constants";
import { interviewers } from "../interviewers";
import { sendMessageToClient } from "../lambda";
import { interviewersAvailability } from "../services/retrieveAvailability";
import { retrieveUserInformation } from "../users";
import { nextDay, today } from "../util/calendarUtils";

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

export {
  dispatchAvailability,
  dispatchHelpSection,
  dispatchStats,
  dispatchTechnicalInformation,
  dispatchTest,
};
