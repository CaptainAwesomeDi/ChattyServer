// server.js

const express = require('express');
const SocketServer = require('ws').Server;
const uuidv4 = require('uuid/v4');
// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
  // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

wss.on('connection', (ws) => {
  console.log('Client connected');

  wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
};

 wss.broadcast(JSON.stringify({type:'userConnect',onlineNumber:wss.clients.size}));

  ws.on('message', (data) => {
    const clientDataObj = JSON.parse(data);

    //check which type of message and set client response type
    switch (clientDataObj.type) {
      case "postNotification":
        clientDataObj.type = 'incomingNotification';
        break;
      case "postMessage":
        clientDataObj.type = 'incomingMessage';
        break;
      case "postError":
        clientDataObj.type = 'incomingError';
    }

    //constructing a new message
    const newServerMessage = {
      id: uuidv4(),
      type: clientDataObj.type,
      username: clientDataObj.username,
      content: clientDataObj.content
    }

    if (newServerMessage.type !== 'incomingError') {
      wss.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(newServerMessage));
        }
      });
    } else {
      ws.send(JSON.stringify(newServerMessage));
    }
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    wss.broadcast(JSON.stringify({type:'userConnect',onlineNumber:wss.clients.size}));
});

});