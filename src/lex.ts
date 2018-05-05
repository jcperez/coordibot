import { Context, Callback } from 'aws-lambda';

const genericLexHandler = (event: any, context: Context, callback: Callback, dispatcher: Function): void => {
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
const closeLexDialog = (sessionAttributes: any, fulfillmentState: any, message: any) => {
  return {
    sessionAttributes,
    dialogAction: {
      type: 'Close',
      fulfillmentState,
      message,
    },
  };
};

const sendMessageToClient = (message: string, sessionAttributes: any) => {
  return closeLexDialog(
    sessionAttributes,
    'Fulfilled',
    {
      'contentType': 'PlainText',
      'content': message
    }
  );
};

export { genericLexHandler, closeLexDialog, sendMessageToClient };
