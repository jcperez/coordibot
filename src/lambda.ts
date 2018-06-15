import { Callback, Context } from "aws-lambda";

// tslint:disable-next-line
const genericLambdaHandler = (event: any, context: Context | null, callback: Callback, dispatcher: Function): void => {
  try {
    console.log(`request received for userId=${event.userId}, intentName=${event.currentIntent.name}`);
    dispatcher(event, (response: any) => {
      callback(null, response);
    });
  } catch (err) {
    callback(err);
  }
};

// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled
const closeLambdaDialog = (sessionAttributes: any, fulfillmentState: any, message: any) => {
  return {
    dialogAction: {
      fulfillmentState,
      message,
      type: "Close",
    },
    sessionAttributes,
  };
};

const sendMessageToClient = (message: string, sessionAttributes: any) => {
  return closeLambdaDialog(
    sessionAttributes,
    "Fulfilled",
    {
      content: message,
      contentType: "PlainText",
    },
  );
};

export { genericLambdaHandler, sendMessageToClient };
