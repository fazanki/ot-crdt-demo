"use client";

import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export default function CRDTEditor() {
  const [doc] = useState(() => new Y.Doc());
  const [yText, setYText] = useState(() => doc.getText("shared-text"));
  const [content, setContent] = useState(yText.toString()); // Sync with Yjs

  useEffect(() => {
    // Connect to WebSocket provider
    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev", 
      "crdt-demo-room", // Static room name for multiple windows to join
      doc
    );

    // Sync Yjs data with React state
    const updateContent = () => setContent(yText.toString());
    yText.observe(updateContent);

    return () => {
      yText.unobserve(updateContent);
      provider.disconnect();
    };
  }, [doc, yText]);

  // Update Yjs shared text when textarea changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    doc.transact(() => {
      yText.delete(0, yText.length); // Clear old content
      yText.insert(0, e.target.value); // Insert new content
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