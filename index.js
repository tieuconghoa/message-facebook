'use strict';
const PAGE_ACCESS_TOKEN = '';
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

var engines = require('consolidate');

app.set('views', __dirname + '/views');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.get('/', function(req, res){
  res.render('index.html');
});
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
  var quickReply = message.quick_reply;
  
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
          defaultAnswer(senderID,messageText)
    }
  } else if(messageAttachments){
    sendTextMessage(senderID,"Message with attachments received")
  }
  if(event.message.quick_reply){
    sendQuickReply(senderID,quickReply,messageId,messageText)
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
      case 'start':
        sendStart(senderID);
        break;
      case 'menu1':
        sendSections(senderID);
        break;
      case 'section1':
        sendquickreply1(senderID);
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

function sendGetStarted(recipientID) {
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
              text : "Hi " + name + " " + lname + " welcome to my bot",
              buttons : [{
                type : "postback",
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

function sendStart(recipientID){
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
              text : "Hi " + name,
              buttons : [{
                type : "postback",
                title : "Menu1",
                payload :"menu1"
              },{
                type : "postback",
                title : "jahjkahjkas",
                payload :"menu2"
              },{
                type : "postback",
                title : "Menu3",
                payload :"menu3"
              }]
            }
          }
        }
      };
      callSendAPI(messageData);
    }
  })
}
function sendSections(recipientID){
  var messageData = {
    recipient : {
      id : recipientID
    },
    message : {
      attachment : {
        type : "template",
        payload : {
          template_type : "button",
          text : "menu1",
          buttons : [{
            type : "postback",
            title : "Section1",
            payload : "section1"
          },{
            type : "postback",
            title : "Section2",
            payload : "section2"
          },{
            type : "postback",
            title : "Section3",
            payload : "section3"
          }]
        }
      }
    }
  };
  callSendAPI(messageData);
}

function sendquickreply1(recipientID){
  var messageData = {
    recipient : {
      id : recipientID
    },
    message : {
      text : "Pick color:",
      "quick_replies": [{
        "content_type": "text",
        "title":"Green",
        "payload" : "quick1"
      },{
        "content_type": "text",
        "title":"Red",
        "payload" : "quick1"
      },{
        "content_type": "text",
        "title":"Blue",
        "payload" : "quick1"
      },{
        "content_type": "text",
        "title":"img",
        "payload" : "quick1"
      }]
    }
  }
  console.log("quick 1 test success");
  callSendAPI(messageData);
}
function sendQuickReply(senderID,quickReply,messageId,messageText){
  var quickReplyPayload = quickReply.payload;
  console.log("Quick reply for message %s with payload %s",messageId,quickReplyPayload);
  if(quickReplyPayload){
    switch (quickReplyPayload) {
      case 'quick1':
        if(messageText) {
          switch (messageText) {
            case 'Green':
              sendTextMessage(senderID,"yes i recieved the quick reply green, thanks!");
              break;
            case 'Red':
              sendTextMessage(senderID,"yes i recieved the quick reply red, thanks!");
              break;
            case 'Blue':
              sendTextMessage(senderID,"yes i recieved the quick reply blue, thanks!");
              break;
            case 'img':
              sendPhoto(senderID);
              break;
          }
        }
        break;
        default:
          sendTextMessage(senderID,"payload is not difined");
    }
  }
}

function sendPhoto(recipientID){
  const get_random_photo = ((ar) => (ar[Math.floor(Math.random()*ar.length)]));
  var photo1 = "https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500";
  var photo2 = "https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500";
  const photo = [photo1,photo2];

  var messageData = {
    recipient : {
      id : recipientID
    },
    message: {
      attachment : {
        type : "image",
        payload: {
          url : get_random_photo(photo)
        }
      }
    }
  }
  callSendAPI(messageData);
}
app.post("/message", (req,res) => {
  let data = req.body.message;
  defaultAnswer(data);

});
function defaultAnswer(text){
      var messageData = {
        recipient : {
          id : '2223248654408420'
        },
        message : {
          text : text
        }
      } 
      callSendAPI(messageData)
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
