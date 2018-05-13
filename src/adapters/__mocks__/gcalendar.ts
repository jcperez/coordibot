import * as moment from 'moment';

interface UserEvent {
  start: string,
  end: string,
  summary: string,
  calendarId: string,
  message?: string,
  warnings: Array<string>,
  creator: string
}

interface RetrieveEventsOptions {
  startDate: string,
  endDate: string,
  query?: string
}

const retrieveUserEvents = async (user: string, options: RetrieveEventsOptions): Promise<UserEvent[]> => {
  return Promise.resolve([
    {
      start: `${moment().format('YYYY-MM-DD')}T14:00:00-05:00`,
      end: `${moment().format('YYYY-MM-DD')}T15:00:00-05:00`,
      summary: 'Hold for interview',
      calendarId: 'juan.carlos@wizeline.com',
      warnings: [],
      creator: 'juan.carlos@wizeline.com'
    },
    {
      start: `${moment().format('YYYY-MM-DD')}T10:00:00-05:00`,
      end: `${moment().format('YYYY-MM-DD')}T12:00:00-05:00`,
      summary: 'Hold for interview',
      calendarId: 'juan.carlos@wizeline.com',
      warnings: [],
      creator: 'juan.carlos@wizeline.com'
    }
  ]);
};

const availableCalendars = async(options: any): Promise<any> => {
  return Promise.resolve([
    {
      id: 'juan.carlos@wizeline.com',
      timezone: '-0500'
    }
  ]);
};

export { availableCalendars, retrieveUserEvents }
