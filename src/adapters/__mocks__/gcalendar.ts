interface IUserEvent {
  start: string;
  end: string;
  summary: string;
  calendarId: string;
  message?: string;
  warnings: string[];
  creator: string;
}

interface IRetrieveEventsOptions {
  startDate: string;
  endDate: string;
  query?: string;
}

const retrieveUserEvents = async (user: string, options: IRetrieveEventsOptions): Promise<IUserEvent[]> => {
  return Promise.resolve([
    {
      start: `2018-05-25T14:00:00-05:00`,
      end: `2018-05-25T15:00:00-05:00`,
      summary: "Hold for interview",
      calendarId: "juan.carlos@wizeline.com",
      warnings: [],
      creator: "juan.carlos@wizeline.com",
    },
    {
      start: `2018-05-25T10:00:00-05:00`,
      end: `2018-05-25T12:00:00-05:00`,
      summary: "Hold for interview",
      calendarId: "juan.carlos@wizeline.com",
      warnings: [],
      creator: "juan.carlos@wizeline.com",
    },
  ]);
};

const availableCalendars = async (options: any): Promise<any> => {
  return Promise.resolve([
    {
      id: "juan.carlos@wizeline.com",
      timezone: "-0500",
    },
  ]);
};

export { availableCalendars, retrieveUserEvents };
