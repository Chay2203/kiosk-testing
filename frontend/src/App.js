import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@mui/material'; 
import './App.css'; 

const API = 'http://localhost:3001'; 

const App = () => {
  const [isConnected, setIsConnected] = useState(false);

  const sendCommand = async (command) => {
    try {
      const response = await axios.post(`${API}/send_command`, { command });
      console.log('Command sent:', response.data);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  const connectBluetooth = async () => {
    try {
      const response = await axios.post(`${API}/connect_bluetooth`);
      console.log('Bluetooth connection response:', response.data);
      setIsConnected(true); 
    } catch (error) {
      console.error('Error connecting to Bluetooth:', error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Kiosk Control Panel</h1>

      <div className="bluetooth-button-container">
        <Button className="bluetooth-button" onClick={connectBluetooth}>
          {isConnected ? 'Connected' : 'Connect to Bluetooth'}
        </Button>
      </div>

      {isConnected && (
        <div className="button-container">
          <Button onClick={() => sendCommand('h-x')}>Home Machine</Button>
          <Button onClick={() => sendCommand('g-x')}>Move to Dispenser</Button>
          <Button onClick={() => sendCommand('dx-y')}>Dispense for y sec</Button>
          <Button onClick={() => sendCommand('c-x')}>Clean Dispenser</Button>
          <Button onClick={() => sendCommand('sx-1')}>Open Doors</Button>
          <Button onClick={() => sendCommand('r:dx1-y1:dx2-y2')}>Execute Recipe</Button>
        </div>
      )}
    </div>
  );
};

export default App;
