"use client";

import { useEffect, useState, useRef } from "react";
import ShareDB from "sharedb/lib/client";
import ReconnectingWebSocket from "reconnecting-websocket";
import * as richText from "ot-text";

ShareDB.types.register(richText.type);

export default function OTEditor() {
    const [text, setText] = useState("");
    const [docInitialized, setDocInitialized] = useState(false);

    // Create a ref to hold the doc object
    const docRef = useRef<any>(null);

    useEffect(() => {
        // First ensure the server is running
        fetch("/api/ot-server")
            .then(() => {
                // Then connect to WebSocket
                const socket = new ReconnectingWebSocket('ws://localhost:8080', [], {
                    WebSocket: WebSocket,
                    connectionTimeout: 1000,
                    maxRetries: 10,
                });

                socket.addEventListener('open', () => {
                    console.log("WebSocket connection established.");
                });

                socket.addEventListener('error', (err) => {
                    console.error("WebSocket connection error:", err);
                });

                socket.addEventListener('close', () => {
                    console.log("WebSocket connection closed");
                });
                // @ts-ignore
                const connection = new ShareDB.Connection(socket);
                const doc = connection.get("documents", "example-doc");
                docRef.current = doc;

                doc.subscribe((err: any) => {
                    if (err) {
                        console.error("Subscription error:", err);
                        return;
                    }
                    
                    if (doc.type === null) {
                        doc.create('', 'text', (err) => {
                            if (err) console.error("Create error:", err);
                            setDocInitialized(true);
                        });
                    } else {
                        setText(doc.data || '');
                        setDocInitialized(true);
                    }

                    doc.on('op', () => {
                        setText(doc.data || '');
                    });
                });

                return () => {
                    socket.close();
                };
            })
            .catch(err => console.error("Failed to initialize OT server:", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        
        if (!docInitialized || !docRef.current) {
            return;
        }

        // Only proceed if there's an actual change
        if (newText !== text) {
            try {
                // Find the position where texts differ
                let i = 0;
                const minLen = Math.min(text.length, newText.length);
                while (i < minLen && text[i] === newText[i]) i++;

                const ops: any[] = [];

                // If we need to delete characters
                if (i < text.length) {
                    ops.push(i);  // Position
                    ops.push(text.length - i);  // Number of characters to delete
                }

                // If we need to insert characters
                if (i < newText.length) {
                    ops.push(i);  // Position
                    ops.push(newText.slice(i));  // String to insert
                }

                console.log("Submitting operation:", ops);
                
                if (ops.length > 0) {
                    docRef.current.submitOp(ops, (err: any) => {
                        if (err) {
                            console.error("Operation submission failed:", err);
                        } else {
                            setText(newText);
                            console.log("Operation submitted successfully", ops);
                        }
                    });
                }
            } catch (err) {
                console.error("Error in handleChange:", err);
            }
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-lg font-bold">Operational Transformation Editor</h1>
            <textarea
                className="border w-full h-40 p-2 mt-4"
                value={text}
                onChange={handleChange}
            />
        </div>
    );
}