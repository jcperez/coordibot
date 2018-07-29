import * as config from "config";
import * as request from "request";

const getSlackUserId = (userId: string): string => {
  return userId.split(":")[2];
};

const getRequestOptions = (token: string, slackUserId: string): any => {
  return {
    form: {
      token,
      user: slackUserId,
    },
    url: "https://slack.com/api/users.info",
  };
};

const retrieveUserInformation = (userId: string): any => {
  const authToken = config.get("SLACK.TOKEN") as string;
  const slackUserId = getSlackUserId(userId);

  return new Promise((resolve: any, reject: any) => {
    const requestOptions = getRequestOptions(authToken, slackUserId);

    const requestHandler = (err: any, httpResponse: any, body: string | null) => {
      if (err || body == null) {
        return reject(new Error("Error while getting response from Slack"));
      }

      if (httpResponse.status >= 400) {
        console.log(`Error while getting response from Slack. Status code ${httpResponse.status}`);
        return reject(new Error("Error while getting response from Slack"));
      }

      try {
        const user = JSON.parse(body);
        return resolve(user.user);
      } catch (error) {
        console.log(error);
        return reject(error);
      }
    };

    request.post(requestOptions, requestHandler);
  });
};

export { retrieveUserInformation };
