import * as config from "config";

const interviewers: string[] = config.has("INTERVIEWERS") ?
  JSON.parse(config.get("INTERVIEWERS")) :
  [""];

export { interviewers };
