import * as config from "config";

const interviewers: string[] = JSON.parse(config.get("INTERVIEWERS"));

export { interviewers };
