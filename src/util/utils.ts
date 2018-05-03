import { UserEvent } from '../adapters/gcalendar';

import * as _ from 'lodash';

const eventMatching = (keywords: Array<string>, summary: string) => {
  if (!summary) return false;
  return _.some(keywords, (keyword: string) => {
    let keywordArray = keyword.split(" ");
    return _.every(keywordArray, (word: string) => {
      return summary.toUpperCase().indexOf(word.toUpperCase()) >= 0;
    });
  });
};

const sortStrings = (a: UserEvent, b: UserEvent): number => {
  if (a.message && b.message) {
    return a.message.localeCompare(b.message);
  }
  return 0;
}

export { eventMatching, sortStrings };
