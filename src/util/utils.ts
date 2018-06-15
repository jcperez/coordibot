import { IUserEvent } from "../adapters/gcalendar";

import * as _ from "lodash";

const eventMatching = (keywords: string[], summary: string) => {
  if (!summary) { return false; }
  return _.some(keywords, (keyword: string) => {
    const keywordArray = keyword.split(" ");
    return _.every(keywordArray, (word: string) => {
      return summary.toUpperCase().indexOf(word.toUpperCase()) >= 0;
    });
  });
};

const sortStrings = (a: IUserEvent, b: IUserEvent): number => {
  if (a.message && b.message) {
    return a.message.localeCompare(b.message);
  }
  return 0;
};

export { eventMatching, sortStrings };
