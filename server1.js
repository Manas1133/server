import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import fetch from 'node-fetch';

// Initialize Express and Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' folder
app.use(express.static(path.resolve('public')));

// Set up a route to serve your main webpage (user.html)
app.get('/', (req, res) => {
  res.sendFile(path.resolve('public/user.html'));
});

// Set up a route to handle ThingSpeak data fetching
app.get('/get-weather-data', async (req, res) => {
  try {
    const apiKey = 'SFXKUSMWO2KGKTWL'; // ThingSpeak API key
    const channelId = '2809209';
    
    // Fetch the data from ThingSpeak (Adjust the URL for your channel)
    const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=2`);
    const data = await response.json();
    
    // Return the latest feed data
    const latestData = data.feeds[0];  // Assuming the latest data is in the first feed
    res.json(latestData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).send('Error fetching weather data');
  }
});

// WebSocket connection to update the frontend in real-time
io.on('connection', (socket) => {
  console.log('A client connected');
  
  // Send initial data to the client on connection
  fetchWeatherData().then(data => {
    socket.emit('updateWeatherData', data);
  });

  // Repeatedly fetch weather data and push it to the client every 30 seconds
  setInterval(async () => {
    const data = await fetchWeatherData();
    socket.emit('updateWeatherData', data);
  }, 30000); // 30 seconds
});

// Function to fetch weather data from ThingSpeak
async function fetchWeatherData() {
  try {
    const apiKey = 'SFXKUSMWO2KGKTWL'; // ThingSpeak API key
    const channelId = '2809209';
    
    const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=2`);
    const data = await response.json();
    const latestData = data.feeds[0];  // Return latest feed
    
    return latestData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
