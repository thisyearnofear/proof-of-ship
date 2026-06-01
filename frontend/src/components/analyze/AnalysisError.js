/**
 * AnalysisError — inline error card shown when analysis fails.
 */
import { Card } from "@/components/common/Card";

export default function AnalysisError({ message }) {
  return (
    <Card className="p-5 mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </Card>
  );
}
