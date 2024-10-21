const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const noble = require('@abandonware/noble');

const app = express();
const port = 3001;
let isBluetoothConnected = false;
let connectedPeripheral = null;  

app.use(cors());
app.use(bodyParser.json());

const logStatus = (message) => {
    console.log(`[STATUS] ${message}`);
};

app.post('/connect_bluetooth', async (req, res) => {
    try {
        noble.on('stateChange', (state) => {
            if (state === 'poweredOn') {
                logStatus('Bluetooth is powered on. Starting scanning...');
                noble.startScanning(['12ab'], false); //Device UUID
            } else {
                logStatus('Bluetooth is not powered on. Stopping scanning...');
                noble.stopScanning();
            }
        });

        noble.on('discover', (peripheral) => {
            logStatus(`Discovered peripheral: ${peripheral.advertisement.localName}`);

            console.log(`Peripheral ID: ${peripheral.id}`);
            console.log(`UUIDs: ${peripheral.advertisement.serviceUuids}`);
            console.log(`RSSI: ${peripheral.rssi}`);

            noble.stopScanning();
            peripheral.connect((error) => {
                if (error) {
                    console.error('Failed to connect to peripheral:', error);
                    return res.status(500).json({ error: 'Failed to connect to Bluetooth' });
                }

                logStatus(`Connected to peripheral: ${peripheral.advertisement.localName}`);
                connectedPeripheral = peripheral;
                isBluetoothConnected = true;
                res.json({ status: 'Bluetooth connected successfully' });

                peripheral.discoverServices([], (error, services) => {
                    if (error) {
                        console.error('Failed to discover services:', error);
                    } else {
                        logStatus('Services discovered:');
                        services.forEach(service => {
                            logStatus(`Service UUID: ${service.uuid}`);
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error initiating Bluetooth connection:', error);
        res.status(500).json({ error: 'Failed to connect to Bluetooth' });
    }
});

app.post('/send_command', async (req, res) => {
    const { command } = req.body;

    if (!isBluetoothConnected) {
        return res.status(400).json({ error: 'Bluetooth not connected. Please connect first.' });
    }

    try {
        logStatus(`Sending command to robot: ${command}`);
        const bufferCommand = Buffer.from(command, 'utf-8');

        const serviceUUID = 'fff0'; // Service UUID pettali
        const characteristicUUID = 'fff1'; // Characteristic UUID pettali

        connectedPeripheral.discoverSomeServicesAndCharacteristics([serviceUUID], [characteristicUUID], (error, services, characteristics) => {
            if (error) {
                console.error('Error discovering services and characteristics:', error);
                return res.status(500).json({ error: 'Failed to send command' });
            }

            const characteristic = characteristics[0];
            logStatus(`Writing command to characteristic: ${characteristicUUID}`);

            characteristic.write(bufferCommand, true, (error) => {
                if (error) {
                    console.error('Error writing command to characteristic:', error);
                    return res.status(500).json({ error: 'Failed to send command' });
                }

                logStatus('Command sent successfully');
                res.json({ status: 'Command sent successfully' });
            });
        });
    } catch (error) {
        console.error('Error sending command:', error);
        res.status(500).json({ error: 'Failed to send command' });
    }
});

app.listen(port, () => {
    logStatus(`Backend listening at http://localhost:${port}`);
});
