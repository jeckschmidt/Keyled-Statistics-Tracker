import { Server } from 'socket.io';
import { tableToJSON } from './database.js';

var io

export function startWebSocketServer(server) {
    io = new Server(server);

    io.on('connection', async (socket) => {
        console.log('Client connected:', socket.id);

        // Send JSON on connect
        var table = await tableToJSON()
        socket.emit('init', table)


        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}

// export the io instance
export function getIo() {
    if (!io) throw new Error('Socket.IO not initialized yet');
    return io;
}