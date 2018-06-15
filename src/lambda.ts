import { Callback, Context } from "aws-lambda";

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
    sessionAttributes,
    dialogAction: {
      type: "Close",
      fulfillmentState,
      message,
    },
  };
};

const sendMessageToClient = (message: string, sessionAttributes: any) => {
  return closeLambdaDialog(
    sessionAttributes,
    "Fulfilled",
    {
      contentType: "PlainText",
      content: message,
    },
  );
};

export { genericLambdaHandler, sendMessageToClient };
