import * as config from "config";
import * as request from "request";

const retrieveUserInformation = (userId: string): any => {
  const authToken = config.get("SLACK.TOKEN");
  const slackUserId = userId.split(":")[2];
  return new Promise((resolve: any) => {
    request.post(
      {
        form: {
          token: authToken,
          user: slackUserId,
        },
        url: "https://slack.com/api/users.info",
      }, (err: any, httpResponse: any, body: string | null) => {
        if (err || body == null) {
          throw new Error("Error");
        }
        const user = JSON.parse(body);
        return resolve(user.user);
      });
    });
};

export { retrieveUserInformation };
