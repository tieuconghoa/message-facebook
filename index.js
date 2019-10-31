'use strict';
const PAGE_ACCESS_TOKEN = 'EAAEVgJ1gCn4BAJwnlS8jicfGra31NfYxHsPW9QLkP4WvIqT8ra8H3yW3ZAa6HZB0ra8iOoaMbxiYq5nN9G60rDlecpZCUph8OWWBvTCb0Qn1tiZCe3QWLFUoPje3ZBkMgQzODXctdJCk1A9xnz5sAdSyL8aM9ZAa8XQEHJu0eLK7oUcKgWax31iZA4lD8G7R7YZD';
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser');
  let app = express();
  app.use(body_parser.json()); // creates express http server
  app.use(body_parser.urlencoded({
    extended : true
  }));

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "my_verity_token";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});
// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let data  = req.body;

  // Check the webhook event is from a Page subscription
  if (data.object === 'page') {

    data.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      var pageID = entry.id;
      var timeOfEvent = entry.time;


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      entry.messaging.forEach(function(event) {
        if (event.message) {
          handleMessage(event);        
        } else if (event.postback) {
          handlePostback(event);
        } else {
          console.log("Webhook receivied unknown event ",event);
        }
      });
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});



function handleMessage(event) {
 
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  
  console.log("Recivived message for user % d and page %d at %d with message: ", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.id;
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if(messageText) {
    switch(messageText) {
      case 'generic' :
        sendGenericMessage(senderID);
        break;
      case 'hi' : 
        sendTextMessage(senderID,"hi there");
        break;
      case 'How are you':
        sendTextMessage(senderID, " am fine and you");
        break;
      case 'fine':
        sendTextMessage(senderID, 'cool');
        break;
      case 'menu':
        sendplay(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if(messageAttachments){
    sendTextMessage(senderID,"Message with attachments received")
  }
}

function handlePostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    var payload = event.postback.payload;

    console.log("Received postback for user %d and page % with payload '%s' at %d", senderID,recipientID,payload,timeOfPostback);

    switch(payload){
      case 'GET_STARTED':
        sendGetStarted(senderID);
        break; 
    }
  }

  function sendTextMessage(recipientID,messageText){
    var messageData = {
      recipient : {
        id : recipientID
      },
      message : {
        text : messageText
      }
    }
    callSendAPI(messageData);
  }

  function sendGenericMessage(recipientID){
    var messageData = {
      recipient : {
        id : recipientID
      },
      message : {
        attachment : {
          type : "template",
          payload : {
            template_type : "generic",
            elements : [{
              title :"Welcome!",
              image_url :"https://petersfancybrownhats.com/company_image.png",
              subtitle :"We have the right hat for everyone.",
              buttons : [{
                  type: "web_url",
                  url : "https://petersfancybrownhats.com/view?item=103",
                 title : "open web"
              },{
                  type:"postback",
                  title:"call postback",
                  payload : "payload for first bubble"
              }],
          },{
            title : "touch",
            subtitle : "your hand, now in VR",
            item_url : "https://www.oculus.com/en-us/touch",
            image_url : "http://messagerdemo.parseapp.com/img/touch.png",
            buttons : [{
              type : "web_url",
              url : "https://www.oculus.com/en-us/touch",
              title : "open web"
            },{
              type : "postback",
              title : "Call Postback",
              payload : "payload for second bubble"
            }]
          }]
        }
      }
    }
  }
    callSendAPI(messageData);
}

function sendplay(recipientID){
  var messageData = {
    recipient : {
      id : recipientID
    },
    message : {
      attachment : {
        type : "template",
        payload : {
          template_type : "button",
          text : "game",
          buttons : [{
            type: "postback",
            title : "Puzzle",
            payload : "puzzle"
          },{
            type : "postback",
            title : "Know yourself",
            payload : "knowyourself"
          },{
            type : "postback",
            title : "Find different",
            payload : "finddifferent"
          }]
        }
      }
    }
  }
  callSendAPI(messageData);
}

function sendGetStarted(recipientID){
  request({
    url : "https://graph.facebook.com/v2.6/"+recipientID,
    qs: { access_token: PAGE_ACCESS_TOKEN,
      fields : "" 
    },
    method : "GET",
  },function(err, res, body){
    if(err){
      console.log("error getting username")
    } else {
      var bodyObj = JSON.parse(body);
      var name = bodyObj.first_name
      var lname = bodyObj.last_name
      var pc = bodyObj.profile_pic
      var locale = bodyObj.locale
      var timezone = bodyObj.timezone
      var gender  = bodyObj.gender

      console.log(JSON.parse(body))

      var messageData = {
        recipient : {
          id : recipientID
        },
        message : {
          attachment : {
            type : "template",
            payload : {
              template_type : "button",
              text : "Hi welcome : )" + name + " " + lname + " to my bot",
              buttons : [{
                type : "posttback",
                title : "start now",
                payload :"start"
              }]
            }
          }
        }
      };
      callSendAPI(messageData);
    }
  })
}

function callSendAPI(messageData) {
  // Construct the message body
  // Send the HTTP request to the Messenger Platform
  request({
    uri: "https://graph.facebook.com/v2.6/me/messages",
    qs: { "access_token": PAGE_ACCESS_TOKEN },
    method: "POST",
    json: messageData
  }, (err, res, body) => {
    if (!err && res.statusCode == 200) {
      var recipientID = body.recipient_id;
      var messageId = body.message_id;
      console.log('Successfully sent generic message with id %s to recipient %s', messageId, recipientID);
    } else {
      console.error("Unable to send message:");
      console.error(res);
      console.error(err);
    }
  }); 
}
