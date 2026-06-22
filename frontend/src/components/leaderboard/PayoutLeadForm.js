import { useState } from "react";
import { Input } from "@/components/common/Input";
import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function PayoutLeadForm({ className = "" }) {
  const [hackathonName, setHackathonName] = useState("");
  const [email, setEmail] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hackathonName.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payout-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonName: hackathonName.trim(),
          email: email.trim(),
          prizeAmount: prizeAmount ? Number(prizeAmount) : null,
          wallet: wallet.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-primary">Thanks for contributing!</p>
        <p className="text-sm text-secondary mt-1">
          We&apos;ll verify the payout data and update the leaderboard.
        </p>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <form onSubmit={handleSubmit} className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <EnvelopeIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-primary">Know a hackathon we&apos;re missing?</h3>
        </div>
        <p className="text-sm text-secondary mb-4">
          Tell us about a hackathon payout you&apos;re tracking. We&apos;ll verify it and add it to the leaderboard.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Input
            placeholder="Hackathon name *"
            value={hackathonName}
            onChange={(e) => setHackathonName(e.target.value)}
            required
            size="sm"
          />
          <Input
            type="email"
            placeholder="Your email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            size="sm"
          />
          <Input
            type="number"
            placeholder="Prize amount (optional)"
            value={prizeAmount}
            onChange={(e) => setPrizeAmount(e.target.value)}
            size="sm"
          />
          <Input
            placeholder="Your wallet address (optional)"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            size="sm"
          />
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!hackathonName.trim() || !email.trim()}
        >
          Submit Payout Info
        </Button>
      </form>
    </Card>
  );
}
