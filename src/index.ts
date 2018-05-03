import * as _ from 'lodash';
import * as moment from 'moment';

import { Context, Callback } from 'aws-lambda';

import { interviewers } from './interviewers';
import { eventMatching, sortStrings } from './util/utils';
import { detectEventConflict } from './util/calendarUtils';
import { availableCalendars, retrieveUserEvents, UserEvent } from './adapters/gcalendar';

const keywords = [
  'Hold for interview'
];

const isDurationAllowed = (event: UserEvent, minimumDuration: Number = 90): boolean => {
  const start = moment(event.start);
  const end = moment(event.end);

  const duration = moment.duration(end.diff(start));
  return duration.asMinutes() >= minimumDuration;
};

const interviewersAvailability = async (startDate : string, endDate?: string) => {
  const payload = {
    startDate: startDate,
    endDate: endDate || moment(startDate).add(1, 'day').format('YYYY-MM-DD')
  }

  console.log(`Retrieving availability for ${payload.startDate} to ${payload.endDate}`);

  const calendars = await availableCalendars(payload);
  const calendarIds: Array<string> = calendars.map((calendar: any) => calendar.id);

  let availability = {};

  let interviewersSlots: Array<UserEvent>[] = await Promise.all(interviewers.map(interviewer => {
    if (calendarIds.indexOf(interviewer) > -1) {
      return retrieveUserEvents(interviewer, payload)
        .catch(err => []);
    }
    console.log(`Skipping ${interviewer}. Service doesn't have access to his/her calendar.`);
    return Promise.resolve([]);
  }));


  for (let allSlots of interviewersSlots) {
    let slots: Array<UserEvent> = [];
    slots = allSlots.filter((event: UserEvent) => eventMatching(keywords, event.summary));
    slots = slots.filter(slot => slot.creator === slot.calendarId);

    for (let slot of slots) {
      const date = moment(slot.start);
      const end = moment(slot.end);
      const day = date.format('YYYY-MM-DD');

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

// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled
function close(sessionAttributes: any, fulfillmentState: any, message: any) {
  return {
      sessionAttributes,
      dialogAction: {
          type: 'Close',
          fulfillmentState,
          message,
      },
  };
}

// --------------- Events -----------------------
async function dispatchAvailability(intentRequest: any, callback: any) {
  const sessionAttributes = intentRequest.sessionAttributes;
  const slots = intentRequest.currentIntent.slots;
  const interviewDate = slots.interviewDate;

  console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

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

  callback(
    close(
      sessionAttributes,
      'Fulfilled',
      {
        'contentType': 'PlainText',
        'content': answer
      }
    )
  );
}

async function dispatchStats(intentRequest: any, callback: any) {
  const sessionAttributes = intentRequest.sessionAttributes;
  const slots = intentRequest.currentIntent.slots;

  console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

  const date = slots.reference;

  // Validate string to be a ISO 8601 week date

  const week = moment(date, "YYYY-[W]WW", true);
  let answer = '';

  if (!week.isValid()) {
    answer = 'I cannot process your request. Say something like `stats this week` or `stats next week`';
  } else {
    const startWeek = moment(date);
    const endWeek = moment(date).add(5, 'days');

    const availability = await interviewersAvailability(startWeek.format('YYYY-MM-DD'), endWeek.format('YYYY-MM-DD'));

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

  callback(
    close(
      sessionAttributes,
      'Fulfilled',
      {
        'contentType': 'PlainText',
        'content': answer
      }
    )
  );
}

const formatTestResponse = (calendars: Array<any>): string => {
  const calendarIds = calendars.map(calendar => calendar.id);
  let answer = '';
  for (let calendar of calendarIds) {
    if (interviewers.indexOf(calendar) == -1) {
      // answer += `${calendar} - Not allowed as an interviewer`
    } else {
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

async function dispatchTest(event: any, callback: any) {
  const sessionAttributes = event.sessionAttributes;

  console.log(`request received for userId=${event.userId}, intentName=${event.currentIntent.name}`);

  const payload = {
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().add(1, 'day').format('YYYY-MM-DD'),
  }

  const calendars = await availableCalendars(payload);
  const answer = formatTestResponse(calendars);

  callback(
    close(
      sessionAttributes,
      'Fulfilled',
      {
        'contentType': 'PlainText',
        'content': answer
      }
    )
  );
}

const retrieveAvailabilityHandler = (event: any, context: Context, callback: Callback) => {
  try {
    dispatchAvailability(event, (response: any) => {
      callback(null, response);
    });
  } catch (err) {
    callback(err);
  }
};

const testRetrieveAvailabilityHandler = (event: any, context: Context, callback: Callback) => {
  try {
    dispatchTest(event, (response: any) => {
      callback(null, response);
    });
  } catch (err) {
    callback(err);
  }
};

const retrieveStatistics = (event: any, context: Context, callback: Callback) => {
  try {
    dispatchStats(event, (response: any) => {
      callback(null, response);
    });
  } catch (err) {
    callback(err);
  }
};

export { retrieveAvailabilityHandler, testRetrieveAvailabilityHandler, retrieveStatistics }
