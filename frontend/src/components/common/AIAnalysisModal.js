import React, { useState, useEffect } from 'react';
import NanopaymentWidget from './NanopaymentWidget';

export default function AIAnalysisModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const handleRequest = (e) => {
      setProject(e.detail.project);
      setIsOpen(true);
    };

    window.addEventListener('requestAIAnalysis', handleRequest);
    return () => window.removeEventListener('requestAIAnalysis', handleRequest);
  }, []);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6 pb-0">
          <h2 className="text-xl font-bold text-gray-900 mb-2">AI Health Analysis</h2>
          <p className="text-sm text-gray-500 mb-6">
            Get an instant, objective health score for <strong>{project.name || project.slug}</strong> 
            powered by our AI Underwriter agent.
          </p>
        </div>

        <div className="p-6 pt-0 bg-gray-50 border-t border-gray-100">
          <NanopaymentWidget
            projectId={project.id}
            projectName={project.name || project.slug}
            onScoreReceived={(score) => {
              // Optionally dispatch an event or update context so the card reflects the new score
              // For now, we'll just close the modal after a short delay
              setTimeout(() => {
                setIsOpen(false);
                window.location.reload(); // Simple way to refresh the data
              }, 2000);
            }}
          />
        </div>
      </div>
    </div>
  );
}
