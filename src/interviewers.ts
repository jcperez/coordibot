import * as config from 'config';

const interviewers: Array<string> = JSON.parse(config.get('INTERVIEWERS'));

export { interviewers };
