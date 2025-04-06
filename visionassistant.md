Use one of our client libraries to get started quickly.

Node.js

Python

HTTP
Set the REPLICATE_API_TOKEN environment variable
export REPLICATE_API_TOKEN=r8_3ce**********************************

Visibility

Copy
Learn more about authentication
Install Replicate’s Node.js client library
npm install replicate

Copy
Learn more about setup
Run yorickvp/llava-v1.6-mistral-7b using Replicate’s API. Check out the model's schema for an overview of inputs and outputs.
import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    image: "https://replicate.delivery/pbxt/KKNB7w6pjN79j5pHDSyYXa5EwaQE9FL5fx6Qa83XMn1HYuKm/extreme_ironing.jpg",
    prompt: "What is unusual about this image?"
};

for await (const event of replicate.stream("yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874", { input })) {
  process.stdout.write(`${event}`)
  //=> "The "
};
process.stdout.write("\n")


const Replicate = require("replicate")
const replicate = new Replicate()

const input = {
    image: "https://replicate.delivery/pbxt/KKNB7w6pjN79j5pHDSyYXa5EwaQE9FL5fx6Qa83XMn1HYuKm/extreme_ironing.jpg",
    prompt: "What is unusual about this image?"
};

for await (const event of replicate.stream("yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874", { input })) {
  // event: { event: string; data: string; id: string }
  process.stdout.write(`${event}`)
  //=> "The "
};
process.stdout.write("\n");

Copy
The replicate.stream() method returns a ReadableStream which can be iterated to transform the events into any data structure needed.
For example, to stream just the output content back:
function handler(request) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of replicate.stream( "yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874", { input })) {
        controller.enqueue(new TextEncoder().encode(`${event}`));
        //=> "The "
      }
      controller.close();
    },
  });
  return new Response(stream);
}

Copy
Or, stream a list of JSON objects back to the client instead of server sent events:
function handler(request) {
  const iterator = replicate.stream( "yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874", { input });
  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      const encoder = new TextEncoder();

      if (done) {
        controller.close();
      } else if (value.event === "output" && value.data.length > 0) {
        controller.enqueue(encoder.encode(JSON.stringify({ data: value.data }) + "\n"));
      } else {
        controller.enqueue(encoder.encode(""));
      }
    },
  });
  return new Response(stream);
}

Copy
Streaming in the browser
The JavaScript library is intended to be run on the server. Once the prediction has been created it's output can be streamed directly from the browser.
The streaming URL uses a standard format called Server Sent Events (or text/event-stream) built into all web browsers.
A common implementation is to use a web server to create the prediction using replicate.predictions.create, passing the stream property set to true. Then the urls.stream property of the response contains a URL that can be returned to your frontend application:
// POST /run_prediction
handler(req, res) {
  const input = {
    image: "https://replicate.delivery/pbxt/KKNB7w6pjN79j5pHDSyYXa5EwaQE9FL5fx6Qa83XMn1HYuKm/extreme_ironing.jpg",
    prompt: "What is unusual about this image?"
};
  const prediction = await replicate.predictions.create({
    version: "19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874",
    input,
    stream: true,
  });
  return Response.json({ url: prediction.urls.stream });
  // Returns {"url": "https://replicate-stream..."}
}

Copy
Make a request to the server to create the prediction and use the built-in EventSource object to read the returned url.
const response = await fetch("/run_prediction", { method: "POST" });
const { url } = await response.json();

const source = new EventSource(url);
source.addEventListener("output", (evt) => {
  console.log(evt.data) //=> "The "
});
source.addEventListener("done", (evt) => {
  console.log("stream is complete");
});

Copy
Prediction lifecycle
Running predictions and trainings can often take significant time to complete, beyond what is reasonable for an HTTP request/response.
When you run a model on Replicate, the prediction is created with a “starting” state, then instantly returned. This will then move to "processing" and eventual one of “successful”, "failed" or "canceled".
Starting

Running


Succeeded

Failed

Canceled
You can explore the prediction lifecycle by using the predictions.get() method to retrieve the latest version of the prediction until completed.
Show example



Webhooks
Webhooks provide real-time updates about your prediction. Specify an endpoint when you create a prediction, and Replicate will send HTTP POST requests to that URL when the prediction is created, updated, and finished.
It is possible to provide a URL to the predictions.create() function that will be requested by Replicate when the prediction status changes. This is an alternative to polling.
To receive webhooks you’ll need a web server. The following example uses Hono, a web standards based server, but this pattern applies to most frameworks.
Show example



Then create the prediction passing in the webhook URL and specify which events you want to receive out of "start", "output", ”logs” and "completed".
const input = {
    image: "https://replicate.delivery/pbxt/KKNB7w6pjN79j5pHDSyYXa5EwaQE9FL5fx6Qa83XMn1HYuKm/extreme_ironing.jpg",
    prompt: "What is unusual about this image?"
};

const callbackURL = `https://my.app/webhooks/replicate`;
await replicate.predictions.create({
  version: "19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874",
  input: input,
  webhook: callbackURL,
  webhook_events_filter: ["completed"],
});

// The server will now handle the event and log:
// => {"id": "xyz", "status": "successful", ... }

Copy
ℹ️ The replicate.run() method is not used here. Because we're using webhooks, and we don’t need to poll for updates.
Co-ordinating between a prediction request and a webhook response will require some glue. A simple implementation for a single JavaScript server could use an event emitter to manage this.
Show example



From a security perspective it is also possible to verify that the webhook came from Replicate. Check out our documentation on verifying webhooks for more information.
Access a prediction
You may wish to access the prediction object. In these cases it’s easier to use the replicate.predictions.create() or replicate.deployments.predictions.create() functions which will return the prediction object.
Though note that these functions will only return the created prediction, and it will not wait for that prediction to be completed before returning. Use replicate.predictions.get() to fetch the latest prediction.
const input = {
    image: "https://replicate.delivery/pbxt/KKNB7w6pjN79j5pHDSyYXa5EwaQE9FL5fx6Qa83XMn1HYuKm/extreme_ironing.jpg",
    prompt: "What is unusual about this image?"
};
const prediction = replicate.predictions.create({
  version: "19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874",
  input
});
// { "id": "xyz123", "status": "starting", ... }

Copy
Cancel a prediction
You may need to cancel a prediction. Perhaps the user has navigated away from the browser or canceled your application. To prevent unnecessary work and reduce runtime costs you can use the replicate.predictions.cancel function and pass it a prediction id.
await replicate.predictions.cancel(prediction.id);

mage
uri
Input image

top_p
number
When decoding text, samples from the top p percentage of most likely tokens; lower to ignore less likely tokens

Default
1
Maximum
1
prompt
string
Prompt to use for text generation

history
array
List of earlier chat messages, alternating roles, starting with user input. Include <image> to specify which message to attach the image to.

max_tokens
integer
Maximum number of tokens to generate. A word is generally 2-3 tokens

Default
1024
temperature
number
Adjusts randomness of outputs, greater than 1 is random and 0 is deterministic

Default
0.2
Output schema
Table
JSON

Headers
Prefer
string
Leave the request open and wait for the model to finish generating output. Set to wait=n where n is a number of seconds between 1 and 60.

See https://replicate.com/docs/topics/predictions/create-a-prediction#sync-mode for more information.

Show more
Request body
input
object
Required
The model's input as a JSON object. The input schema depends on what model you are running. To see the available inputs, click the "API" tab on the model you are running or get the model version and look at its openapi_schema property. For example, stability-ai/sdxl takes prompt as an input.

Files should be passed as HTTP URLs or data URLs.

Use an HTTP URL when:

you have a large file > 256kb
you want to be able to use the file multiple times
you want your prediction metadata to be associable with your input files
Use a data URL when:

you have a small file <= 256kb
you don't want to upload and host the file somewhere
you don't need to use the file again (Replicate will not store it)
Show more
stream
boolean
This field is deprecated.

Request a URL to receive streaming output using server-sent events (SSE).

This field is no longer needed as the returned prediction will always have a stream entry in its url property if the model supports streaming.

Show more
version
string
Required
The ID of the model version that you want to run.

webhook
string
An HTTPS URL for receiving a webhook when the prediction has new output. The webhook will be a POST request where the request body is the same as the response body of the get prediction operation. If there are network problems, we will retry the webhook a few times, so make sure it can be safely called more than once. Replicate will not follow redirects when sending webhook requests to your service, so be sure to specify a URL that will resolve without redirecting.

Show more
webhook_events_filter
array
By default, we will send requests to your webhook URL whenever there are new outputs or the prediction has finished. You can change which events trigger webhook requests by specifying webhook_events_filter in the prediction request:

start: immediately on prediction start
output: each time a prediction generates an output (note that predictions can generate multiple outputs)
logs: each time log output is generated by a prediction
completed: when the prediction reaches a terminal state (succeeded/canceled/failed)
For example, if you only wanted requests to be sent at the start and end of the prediction, you would provide:

{
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "input": {
    "text": "Alice"
  },
  "webhook": "https://example.com/my-webhook",
  "webhook_events_filter": ["start", "completed"]
}
Requests for event types output and logs will be sent at most once every 500ms. If you request start and completed webhooks, then they'll always be sent regardless of throttling.

Show more
Examples

Create
Create a prediction and get the output


Streaming

Webhooks
Make a request
/predictions
import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    image: "https://replicate.delivery/pbxt/KKNB7w6pjN79j5pHDSyYXa5EwaQE9FL5fx6Qa83XMn1HYuKm/extreme_ironing.jpg",
    prompt: "What is unusual about this image?"
};

const output = await replicate.run("yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874", { input });
console.log(output.join(""));
//=> "The unusual aspect of this image is that a man is standi...

Copy

Get a prediction

predictions.get
Input parameters
prediction_id
string
Required
The ID of the prediction to get.
Examples

Get
Get the latest version of a prediction by id

Make a request
/predictions/{prediction_id}
import Replicate from "replicate";
const replicate = new Replicate();

console.log("Getting prediction...")
const prediction = await replicate.predictions.get(predictionId);
//=> {"id": "xyz...", "status": "successful", ... }

Copy

Cancel a prediction

predictions.cancel
Input parameters
prediction_id
string
Required
The ID of the prediction to cancel.
Examples

Cancel
Cancel an in progress prediction

Make a request
/predictions/{prediction_id}/cancel
import Replicate from "replicate";
const replicate = new Replicate();

console.log("Canceling prediction...")
const prediction = await replicate.predictions.cancel(predictionId);
//=> {"id": "xyz...", "status": "canceled", ... }

Copy

List predictions

predictions.list
Examples

List
List the first page of your predictions


Paginate
Make a request
/predictions
import Replicate from "replicate";
const replicate = new Replicate();

const page = await replicate.predictions.list();
console.log(page.results)
//=> [{ "id": "xyz...", "status": "successful", ... }, { ... }]