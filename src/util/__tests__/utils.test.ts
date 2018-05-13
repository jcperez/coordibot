import * as Utils from '../utils';
import * as moment from 'moment';

import { UserEvent } from '../../adapters/gcalendar';

describe('Tests', () => {
  beforeAll(() => {
    console.error = () => {};
    console.log = () => {};
  });

  test('Test sort string function', async () => {
    let a: UserEvent = {
      start: moment().format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
      summary: 'Hold',
      calendarId: 'juan.carlos@wizeline.com',
      creator: 'juan.carlos@wizeline.com',
      message: '10 to 15',
      warnings: []
    };

    let b: UserEvent = {
      start: moment().format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
      summary: 'Hold',
      calendarId: 'juan.carlos@wizeline.com',
      creator: 'juan.carlos@wizeline.com',
      message: '12 to 17',
      warnings: []
    };

    let c: UserEvent = {
      start: moment().format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
      summary: 'Hold',
      calendarId: 'juan.carlos@wizeline.com',
      creator: 'juan.carlos@wizeline.com',
      message: '10 to 15',
      warnings: []
    };

    let d: UserEvent = {
      start: moment().format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
      summary: 'Hold',
      calendarId: 'juan.carlos@wizeline.com',
      creator: 'juan.carlos@wizeline.com',
      warnings: []
    };

    expect(Utils.sortStrings(a, b)).toBe(-1);
    expect(Utils.sortStrings(a, c)).toBe(0);
    expect(Utils.sortStrings(a, d)).toBe(0);
    return expect(Utils.sortStrings(b, a)).toBe(1);
  });
});
