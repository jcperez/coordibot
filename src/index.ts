import * as _ from 'lodash';
import * as moment from 'moment';
import * as config from 'config';

import { Context, Callback } from 'aws-lambda';

import { interviewers } from './interviewers';
import { eventMatching, sortStrings } from './util/utils';
import { detectEventConflict, today, nextDay } from './util/calendarUtils';
import { isDurationAllowed } from './validations';
import { DATE_FORMAT, WEEK_DATE_FORMAT } from './constants';
import { availableCalendars, retrieveUserEvents, UserEvent } from './adapters/gcalendar';
import { genericLexHandler, sendMessageToClient } from './lex';

const keywords: Array<string> = config.get('EVENT_NAME');

const formatTestResponse = (calendars: Array<any>): string => {
  const calendarIds = calendars.map(calendar => calendar.id);
  let answer = '';
  for (let calendar of calendarIds) {
    if (interviewers.indexOf(calendar) != -1) {
      answer += `${calendar} - OK\n`;
    }
  }
  for (let interviewer of interviewers) {
    if (calendarIds.indexOf(interviewer) == -1) {
      answer += `${interviewer} - Waiting for access to calendar\n`
    }
  }
  return answer;
};

const interviewersAvailability = async (startDate : string, endDate?: string) => {
  const payload = {
    startDate: startDate,
    endDate: endDate || nextDay(startDate)
  }

  console.log(`Retrieving availability: ${payload.startDate} to ${payload.endDate}`);

  const calendars = await availableCalendars(payload);
  const calendarIds: Array<string> = calendars.map((calendar: any) => calendar.id);

  let availability = {};

  let interviewersSlots: Array<UserEvent>[] = await Promise.all(interviewers.map(interviewer => {
    if (calendarIds.indexOf(interviewer) > -1) {
      return retrieveUserEvents(interviewer, payload)
        .catch(err => []);
    }
    console.log(`Skipping ${interviewer}. Service doesn't have access to this calendar.`);
    return Promise.resolve([]);
  }));


  for (let allSlots of interviewersSlots) {
    let slots: Array<UserEvent> = [];
    slots = allSlots.filter((event: UserEvent) => eventMatching(keywords, event.summary));
    slots = slots.filter(slot => slot.creator === slot.calendarId);

    for (let slot of slots) {
      const date = moment(slot.start);
      const end = moment(slot.end);
      const day = date.format(DATE_FORMAT);

      if (!availability[day]) {
        availability[day] = [];
      }

      // Add warnings to the slots
      if (!isDurationAllowed(slot)) {
        slot.warnings.push('Event duration is less than 90 mins');
      }

      const conflictEvents = detectEventConflict(slot, allSlots);
      if (conflictEvents.length > 0) {
        let conflictMessage = `Slot has a conflict with \`${conflictEvents[0].summary}\``;
        if (conflictEvents.length > 1) {
          conflictMessage += ` and ${conflictEvents.length - 1} other event(s).`;
        }
        slot.warnings.push(conflictMessage);
      }

      slot.message = `*${date.format('HH:mm')} to ${end.format('HH:mm')}* - ${slot.calendarId} - ${slot.summary}`;

      if (slot.warnings.length) {
        for (let warning of slot.warnings) {
          slot.message += `\n - ${warning}`;
        }
      }
      slot.message += '\n';
      availability[day].push(slot);
    }
  }

  const keys = _.keys(availability);
  for (let day in keys) {
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

  let answer = '';

  const keys = _.keys(availability);
  for (let day in keys) {
    const k = keys[day];
    answer += `Availability for ${k}:\n`;
    for (let slot of availability[k]) {
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
  let answer = '';

  if (!week.isValid()) {
    answer = 'I cannot process your request. Say something like `stats this week` or `stats next week`';
  } else {
    const startWeek = moment(date);
    const endWeek = moment(date).add(5, 'days');

    const availability = await interviewersAvailability(startWeek.format(DATE_FORMAT), endWeek.format(DATE_FORMAT));

    const keys = _.keys(availability);
    let minutes = 0;
    let messages: Array<string> = [];
    for (let day in keys) {
      const k = keys[day];
      let dayAvailability = 0;
      for (let slot of availability[k]) {
        dayAvailability += moment.duration(moment(slot.end).diff(moment(slot.start))).asMinutes();
      }
      minutes += dayAvailability;
      messages.push(`${k}: ${Number(dayAvailability/60).toFixed(2)} hours`);
    }

    answer += `${messages.sort().join('\n')}\n---------------------\nYou have ${Number(minutes/60).toFixed(2)} hours available between ${startWeek.format('MMM D')} and ${endWeek.add(-1, 'days').format('MMM D')}.`;
  }

  callback(sendMessageToClient(answer, sessionAttributes));
}

async function dispatchTest(event: any, callback: any) {
  const sessionAttributes = event.sessionAttributes;

  const payload = {
    startDate: today(),
    endDate: nextDay(),
  }

  const calendars = await availableCalendars(payload);
  const answer = formatTestResponse(calendars);

  callback(sendMessageToClient(answer, sessionAttributes));
}

// --------------- Handlers -----------------------
const retrieveAvailabilityHandler = (event: any, context: Context, callback: Callback) => {
  genericLexHandler(event, context, callback, dispatchAvailability);
};

const testRetrieveAvailabilityHandler = (event: any, context: Context, callback: Callback): void => {
  genericLexHandler(event, context, callback, dispatchTest);
};

const retrieveStatistics = (event: any, context: Context, callback: Callback): void => {
  genericLexHandler(event, context, callback, dispatchStats);
};

export { retrieveAvailabilityHandler, testRetrieveAvailabilityHandler, retrieveStatistics }
