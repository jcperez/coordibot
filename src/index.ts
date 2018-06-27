import { Callback, Context } from "aws-lambda";
import { genericLambdaHandler } from "./lambda";

import * as Dispatchers from "./dispatchers";

const retrieveAvailabilityHandler = (event: any, context: Context | null, callback: Callback) => {
  genericLambdaHandler(event, context, callback, Dispatchers.dispatchAvailability);
};

const testRetrieveAvailabilityHandler = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, Dispatchers.dispatchTest);
};

const retrieveStatisticsHandler = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, Dispatchers.dispatchStats);
};

const displayHelpSectionHandler = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, Dispatchers.dispatchHelpSection);
};

const displayTechnicalInformation = (event: any, context: Context | null, callback: Callback): void => {
  genericLambdaHandler(event, context, callback, Dispatchers.dispatchTechnicalInformation);
};

const mainHandler = (event: any, context: Context | null, callback: Callback): void => {
  const intentName = event.currentIntent.name;

  switch (intentName) {
    case "ScheduleInterview":
      return retrieveAvailabilityHandler(event, context, callback);
    case "AvailabilityStats":
      return retrieveStatisticsHandler(event, context, callback);
    case "TestConnection":
      return testRetrieveAvailabilityHandler(event, context, callback);
    case "Help":
      return displayHelpSectionHandler(event, context, callback);
    default:
      console.log(`Could not handle ${intentName}. Default handler invoked.`);
      return displayHelpSectionHandler(event, context, callback);
  }
};

export {
  retrieveAvailabilityHandler,
  testRetrieveAvailabilityHandler,
  retrieveStatisticsHandler,
  displayHelpSectionHandler,
  mainHandler,
  displayTechnicalInformation,
};
