import React from "react";
import { PlusIcon } from "@heroicons/react/24/solid";

const FloatingActionButton = ({ onClick, icon, "aria-label": ariaLabel }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-110"
      aria-label={ariaLabel}
    >
      {icon || <PlusIcon className="h-6 w-6" />}
    </button>
  );
};

export default FloatingActionButton;
