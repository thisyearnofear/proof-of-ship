import React, { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { Input, Textarea, Select } from "@/components/common/Input";

export default function FeedbackPage() {
  const router = useRouter();
  const { project: projectSlug } = router.query;
  const { currentUser } = useAuth();

  const [message, setMessage] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [rating, setRating] = useState("5");
  const [verificationProvider, setVerificationProvider] = useState("");
  const [verificationProof, setVerificationProof] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return String(projectSlug || "").trim().length > 0;
  }, [projectSlug]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Missing project slug");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug,
          message,
          recordingUrl,
          rating: Number(rating),
          verificationProvider: verificationProvider || null,
          verificationProof: verificationProof || null,
          submittedBy: currentUser?.uid || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit feedback");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Leave feedback</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Share feedback
            </h1>
            <p className="text-gray-600 mb-6">
              Help builders ship better UX. Include a screen recording link if you
              can.
            </p>

            {!canSubmit && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6">
                Missing project. Open feedback from a project page.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                  Feedback submitted. Thank you.
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                  Back
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <Input
                  label="Project"
                  value={String(projectSlug || "")}
                  disabled
                />

                <Select
                  label="Rating"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="5">5 - Loved it</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Okay</option>
                  <option value="2">2 - Friction</option>
                  <option value="1">1 - Blocked</option>
                </Select>

                <Textarea
                  label="What did you try? What was confusing?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Steps you took, what you expected, what happened, where you got stuck..."
                  required
                />

                <Input
                  label="Screen recording URL (optional)"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Human verification (optional)"
                    value={verificationProvider}
                    onChange={(e) => setVerificationProvider(e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="self">Self (Celo)</option>
                    <option value="worldid">World ID</option>
                    <option value="poh">Proof of Humanity</option>
                  </Select>
                  <Input
                    label="Verification proof (optional)"
                    value={verificationProof}
                    onChange={(e) => setVerificationProof(e.target.value)}
                    placeholder="Paste proof / nullifier / tx hash..."
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={!canSubmit}
                  >
                    Submit feedback
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
