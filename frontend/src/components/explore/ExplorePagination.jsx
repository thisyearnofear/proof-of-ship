/**
 * ExplorePagination — Prev/Next + numbered page buttons with smart
 * truncation. Accepts a `resultsRef` to scroll back to the top of the
 * results region on page change.
 */

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 6, 7];
  if (currentPage >= totalPages - 3) return Array.from({ length: 7 }, (_, i) => totalPages - 6 + i);
  return Array.from({ length: 7 }, (_, i) => currentPage - 3 + i);
}

export default function ExplorePagination({ currentPage, totalPages, onPageChange, resultsRef }) {
  if (totalPages <= 1) return null;

  const scrollToResults = () => resultsRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-default">
      <p className="text-sm text-secondary">Page {currentPage} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { onPageChange(Math.max(1, currentPage - 1)); scrollToResults(); }}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-lg border border-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 inline mr-1" /> Previous
        </button>
        <div className="flex gap-1">
          {pageNumbers(currentPage, totalPages).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => { onPageChange(pageNum); scrollToResults(); }}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                pageNum === currentPage
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          onClick={() => { onPageChange(Math.min(totalPages, currentPage + 1)); scrollToResults(); }}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Next <ChevronRightIcon className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </div>
  );
}
