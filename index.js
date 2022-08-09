#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const get = require('lodash/get');
const CncjsKeyboard = require('./utils/CncjsKeyboard');

const generateAccessToken = function(payload, secret, expiration) {
    const token = jwt.sign(payload, secret, {
        expiresIn: expiration
    });

    return token;
};

// Get secret key from the config file and generate an access token
const getUserHome = function() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

module.exports = function(options, callback) {
    options = options || {};
    options.secret = get(options, 'secret', process.env['CNCJS_SECRET']);
    options.baudrate = get(options, 'baudrate', 115200);
    options.socketAddress = get(options, 'socketAddress', 'localhost');
    options.socketPort = get(options, 'socketPort', 8000);
    options.controllerType = get(options, 'controllerType', 'Grbl');
    options.accessTokenLifetime = get(options, 'accessTokenLifetime', '30d');

    if (!options.secret) {
        const cncrc = path.resolve(getUserHome(), '.cncrc');
        try {
            const config = JSON.parse(fs.readFileSync(cncrc, 'utf8'));
            options.secret = config.secret;
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }

    const token = generateAccessToken({ id: '', name: 'cncjs-pendant' }, options.secret, options.accessTokenLifetime);
    const url = 'ws://' + options.socketAddress + ':' + options.socketPort + '?token=' + token;

    socket = io.connect('ws://' + options.socketAddress + ':' + options.socketPort, {
        'query': 'token=' + token
    });

    socket.on('connect', () => {
        console.log('Connected to ' + url);

        // Open port
        socket.emit('open', options.port, {
            baudrate: Number(options.baudrate),
            controllerType: options.controllerType
        });
    });

    socket.on('error', (err) => {
        console.error('Connection error.');
        if (socket) {
            socket.destroy();
            socket = null;
        }
    });

    socket.on('close', () => {
        console.log('Connection closed.');
    });

    socket.on('serialport:open', function(options) {
        options = options || {};

        console.log('Connected to port "' + options.port + '" (Baud rate: ' + options.baudrate + ')');

        callback(null, socket);
    });

    socket.on('serialport:error', function(options) {
        callback(new Error('Error opening serial port "' + options.port + '"'));
    });

    socket.on('serialport:read', function(data) {
        console.log((data || '').trim());
    });

    /*
    socket.on('serialport:write', function(data) {
        console.log((data || '').trim());
    });
    */


    // TODO: Do implementation
          // TODO: implement keyboard handling


        // console.log('Options', options)
          
        const keyboard = new CncjsKeyboard(
            options.devicePath,
            socket,
            options.port,
            options.config,
            { verbose: options.verbose }
        )



        //   const global = {
        //     step: 0,
        //     }
                           

            // const keyboard = new CncjsKeyboard('by-id/usb-Telink_Wireless_Receiver_TLSR8366-if01-event-kbd', true, socket, options.port, global)
    
            // keyboard.createVerboseEventListeners()
    
            // console.log('Start CNCJS keyboard')
    
            //https://github.com/cncjs/cncjs-controller/blob/master/src/controller.js#L213
            //https://github.com/cncjs/cncjs/wiki/Controller-API
    
    
            // const config = require('./config/surno-iee.wirelesseNumericKeypad')

            // console.log(config)
            // console.log(config.global)
            // console.log(config.events)


            // keyboard.on('KEY_ESC:keypress', ({ $socket, $port }) => $socket.emit('command', $port, 'reset'))
            // keyboard.on('KEY_TAB:keypress', ({ $socket, $port }) => $socket.emit('command', $port, 'sleep'))
            // keyboard.on('KEY_EQUAL:keypress', ({ $socket, $port }) => $socket.emit('command', $port, 'unlock'))
            // keyboard.on('KEY_BACKSPACE:keypress', ({ $socket, $port }) => $socket.emit('command', $port, 'reset'))
    
            // // TODO: change event names

            // keyboard.on('KEY_UP:keypress', ({$socket, $port, $global}) => {
            //     $socket.emit('write', $port, 'G91;\n')
            //     $socket.emit('write', $port, 'G0 Y' + $global.step + ';;\n')
            //     $socket.emit('write', $port, 'G90;\n')
            // })
            // keyboard.on('KEY_DOWN:keypress', ({$socket, $port, $global}) => {
            //     $socket.emit('write', $port, 'G91;\n')
            //     $socket.emit('write', $port, 'G0 Y-' + $global.step + ';;\n')
            //     $socket.emit('write', $port, 'G90;\n')
            // })
            // keyboard.on('KEY_LEFT:keypress', ({$socket, $port, $global}) => {
            //     $socket.emit('write', $port, 'G91;\n')
            //     $socket.emit('write', $port, 'G0 X-' + $global.step + ';;\n')
            //     $socket.emit('write', $port, 'G90;\n')
            // })
            // keyboard.on('KEY_RIGHT:keypress', ({$socket, $port, $global}) => {
            //     $socket.emit('write', $port, 'G91;\n')
            //     $socket.emit('write', $port, 'G0 X' + $global.step + ';\n')
            //     $socket.emit('write', $port, 'G90;\n')
            // })
    



            // keyboard.on('KEY_INSERT:keypress', ({ $global }) => $global.step = 1)
            // keyboard.on('KEY_HOME:keypress', ({ $global }) => $global.step = 5)
            // keyboard.on('KEY_PAGEUP:keypress', ({ $global }) => $global.step = 10)
    
};
