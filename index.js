'use strict';

// Imports dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()); // creates express http server

const PAGE_ACCESS_TOKEN = "EAAGgRtHQtyIBAARva9HZCWzSsymbkTAULGyMdrmQdyaY9mA6evYvuEyN98V0BljQCOWXQKeS5ZBTAmMjxIUIrIoAXza76z1n86gpk0EWvFqIKgWYl42nWPAsdJEIlQfFvZAHfYS3uaFRD9mIVYwjSowBwpm2x93aPHTG2gHQx7TbDFADw0ZBdj2Tq99H5PAZD";
const request = require('request');
const https = require('https');


// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));


// default
app.get('/', function (req, res, next) {

    return res.status(200).json({
        message: 'hiiiiiiiii',
    })
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {
    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            // console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            // console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});
// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "1955219965aaaa";

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }

});

// Handles messages events
function handleMessage(sender_psid, received_message) {
    if (sender_psid === "2695713783790206") {
        console.log("this case")
        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": {"access_token": PAGE_ACCESS_TOKEN},
            "method": "POST",
            "json": {
                "recipient": {
                    "id": sender_psid
                },
                "message": {
                    "text": "Eo em"
                }
            }
        }, (err, res, body) => {
            if (!err) {
                console.log('message sent')
            } else {
                console.error("Unable to send message:" + err);
            }
        });
    } else {

        let response;
        // Check if the message contains text
        if (received_message.text) {
            if (received_message.text.toLowerCase() === "tùng") {
                // Create the payload for a basic text message
                response = {
                    "text": "Tùng cằc"
                }
            } else {
                // Create the payload for a basic text message
                response = {
                    "text":
                        `You sent the message: "${received_message.text}". Now send me an image!`
                }
            }
        } else if (received_message.attachments) {

            // Gets the URL of the message attachment
            let attachment_url = received_message.attachments[0].payload.url;
            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Is this the right picture?",
                            "subtitle": "Tap a button to answer.",
                            "image_url": attachment_url,
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Yes!",
                                    "payload": "yes",
                                },
                                {
                                    "type": "postback",
                                    "title": "No!",
                                    "payload": "no",
                                }
                            ],
                        }]
                    }
                }
            }

        }
        // Sends the response message
        getSenderInfo(sender_psid);

        callSendAPI(sender_psid, response);
    }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = {"text": "Thanks!"}
    } else if (payload === 'no') {
        response = {"text": "Oops, try sending another image."}
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function getSenderInfo(sender_psid) {


    https.get("https://graph.facebook.com/" + sender_psid + "?fields=first_name,last_name,profile_pic&access_token=" + PAGE_ACCESS_TOKEN,
        (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                // console.log();
                // Send the HTTP request to the Messenger Platform
                let user = JSON.parse(data);

                request({
                    "uri": "https://graph.facebook.com/v2.6/me/messages",
                    "qs": {"access_token": PAGE_ACCESS_TOKEN},
                    "method": "POST",
                    "json": {
                        "recipient": {
                            "id": sender_psid
                        },
                        "message": {
                            "text": "Hello " + user.first_name,
                        }
                    }
                }, (err, res, body) => {
                    if (!err) {
                        console.log('message sent')
                    } else {
                        console.error("Unable to send message:" + err);
                    }
                });

            });

        }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

}

