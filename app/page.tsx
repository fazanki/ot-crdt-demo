"use client";

import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export default function CRDTEditor() {
  const [doc] = useState(() => new Y.Doc());
  const [yText, setYText] = useState(() => doc.getText("shared-text"));
  const [content, setContent] = useState(yText.toString());

  useEffect(() => {
    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev", 
      "crdt-demo-room",
      doc
    );

    // Suppress WebSocket connection errors
    provider.wsconnected = false; // Disable connection warnings
    provider.shouldConnect = false; // Prevent automatic reconnection

    const updateContent = () => setContent(yText.toString());
    yText.observe(updateContent);

    return () => {
      yText.unobserve(updateContent);
      provider.disconnect();
    };
  }, [doc, yText]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, e.target.value);
    });
  }, [doc, yText]);

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">CRDT Collaborative Editor</h1>
      <textarea
        className="border w-full h-40 p-2 mt-4"
        value={content}
        onChange={handleChange}
      />
    </div>
  );
}