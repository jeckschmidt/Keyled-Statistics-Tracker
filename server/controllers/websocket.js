import { Server } from 'socket.io';
import { tableToJSON } from './database.js';

let io

export function startWebSocketServer(server) {
    io = new Server(server);

    io.on('connection', async (socket) => {
        // Send JSON on connect
        try {
            var table = await tableToJSON()
            socket.emit('init', {success: true, table: table})
        } catch (err) {
            socket.emit('init', {success: false})
            console.error("[Socket.io] Couldn't send table to client: ", err)
        }


        socket.on('disconnect', () => {
        });
    });
}

// export the io instance
export function getIo() {
    if (!io) throw new Error('Socket.IO not initialized yet');
    return io;
}