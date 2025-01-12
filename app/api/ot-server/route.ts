import { NextResponse } from 'next/server';
import http from "http";
import ShareDB from "sharedb";
import WebSocket from "ws";
import WebSocketJSONStream from "@teamwork/websocket-json-stream";
import * as richText from 'ot-text';

// Register the text type
ShareDB.types.register(richText.type);

declare global {
  var backend: ShareDB | undefined;
  var server: http.Server | undefined;
  var wss: WebSocket.Server | undefined;
}

// Initialize ShareDB server
function initOTServer() {
  if (!global.backend) {
    global.backend = new ShareDB();
    
    // Create initial document
    const connection = global.backend.connect();
    const doc = connection.get('documents', 'example-doc');
    
    doc.fetch((err) => {
      if (err) throw err;
      if (!doc.type) {
        // Initialize with empty string and explicit type
        doc.create('', 'text', { source: 'server' }, (err) => {
          if (err) console.error('Error creating document:', err);
          else console.log('Document created successfully');
        });
      }
    });

    // Create WebSocket server
    global.server = http.createServer();
    global.wss = new WebSocket.Server({ noServer: true });

    global.wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      const stream = new WebSocketJSONStream(ws);
      global.backend!.listen(stream);
    });

    // Handle upgrade
    global.server.on('upgrade', (request, socket, head) => {
      global.wss!.handleUpgrade(request, socket, head, (ws) => {
        global.wss!.emit('connection', ws, request);
      });
    });

    global.server.listen(8080, () => {
      console.log('ShareDB WebSocket server running on ws://localhost:8080');
    });
  }
}

// Handle GET requests - using Next.js 13+ Route Handlers syntax
export async function GET() {
  initOTServer();
  return NextResponse.json({ message: "OT server initialized" });
}
