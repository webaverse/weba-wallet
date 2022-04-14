export interface IMessageReceived {
  method: string; // Function to perform
  data: any; // Input params for the function
}

export interface IMessageSent {
  type: "response" | "event"; // Is it a response from a function call or an independent event
  error: string | null; // If there is an error that occured
  method: string; // Function name or event name
  data: any; // Response for the called function or data for the event
}
