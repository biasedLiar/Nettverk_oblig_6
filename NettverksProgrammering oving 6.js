const crypto = require('crypto')

const net = require('net');

// Simple HTTP server responds with a simple WebSocket client test
const httpServer = net.createServer((connection) => {
  connection.on('data', () => {
    let content = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    WebSocket test page1

    <form onsubmit="onSubmit(event)">
      message: <input type="text" name="message" id="message">
      <br>
      <input type="submit" value="submitted">
    </form>

    <script>
      
      let ws = new WebSocket('ws://localhost:3001');
      ws.onmessage = event => alert('Message from server: ' + event.data);
      ws.onopen = () => ws.send('hello');
      function onSubmit(event) {
        event.preventDefault();
        alert("submitted");
        //ws.send(document.getElementById("element").value);
        ws.send("Test123");
      }
    </script>
  </body>
</html>
`;
    connection.write('HTTP/1.1 200 OK\r\nContent-Length: ' + content.length + '\r\n\r\n' + content);
  });
});
httpServer.listen(3000, () => {
  console.log('HTTP server listening on port 3000');
});

// Incomplete WebSocket server
const wsServer = net.createServer((connection) => {
  console.log('Client connected');

  connection.on('data', (data) => {
    console.log('Data received from client: ', data.toString());
    if(data.includes("Sec-WebSocket-Key:")){
      console.log("TRying to start websocket");
      lines=data.toString().split(/\r?\n/);
      let encodedKey = undefined;
      for (let index = 0; index < lines.length; index++) {
        const element = lines[index];
        console.log(element);
        if(element.includes("Sec-WebSocket-Key:")){
          let key = element.split(" ")[1];
          encodedKey = crypto.createHash('sha1').update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest('base64')
        }
      }
      console.log("This is the key: " + encodedKey);
      connection.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: upgrade\r\nSec-WebSocket-Accept: ' + encodedKey + '\r\n\r\n');
    }
  });

  connection.on('end', () => {
    console.log('Client disconnected');
  });
});
wsServer.on('error', (error) => {
  console.error('Error: ', error);
});
wsServer.listen(3001, () => {
  console.log('WebSocket server listening on port 3001');
});