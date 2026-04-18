import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

export default function ShipsLog({ projectSlug, canEdit }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectSlug) return;

    const q = query(
      collection(db, "ships_logs"),
      where("projectSlug", "==", projectSlug),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(newLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/projects/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectSlug,
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post log");
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error posting log:", error);
      alert("Failed to post log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">The Ship's Log</h2>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Post a micro-update (e.g. Just deployed new UI!)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-touch"
              disabled={submitting}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || submitting}
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-touch min-w-touch flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Micro-updates appear here and in the global Engagement Feed.
          </p>
        </form>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8 italic">
            No logs yet. The captain is silent...
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            <div className="space-y-8">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-8 h-8 bg-blue-50 rounded-full border-2 border-blue-200 flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-gray-900">
                        {log.userHandle}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      {log.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
