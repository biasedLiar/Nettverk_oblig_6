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
        //alert(document.getElementById("message").value);
        ws.send(document.getElementById("message").value);
        //ws.send("Test123");
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

let connections = [];
// Incomplete WebSocket server
const wsServer = net.createServer((connection) => {
  console.log('Client connected');
  connections.push(connection);

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
    }else{
      let decodedData = [];
      if(data.length < 126){
        if((128 & data[1]) === 128){
          let mask = data.slice(2, 6);
          for (let index = 6; index < data.length; index++) {
            const element = data[index];
            decodedData[index - 6]= (element ^ mask[(index + 2) % 4]);
          }
        } else{
          decodedData= data.slice(2, data.length);
        }
        console.log("We are in the loop");
      } else{
        console.log("Message is too long.");
      }
      console.log("The data is: " +  data[0] + ", " + data[1]);
      console.log("Decoded data: " + String.fromCharCode(...decodedData));
      let response = [data[0]];
      response[1] =  decodedData.length;
      response = response.concat(decodedData);
      //connection.write(Buffer.from(response));
      broadcast(Buffer.from(response));
      
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

function broadcast(data){
  for (let index = 0; index < connections.length; index++) {
    const connection = connections[index];
    //console.log(connection);
    connection.write(data);
  }
  
  console.log(wsServer.getConnections((err, count) => console.log(count)));
}
