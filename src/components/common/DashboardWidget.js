import React from "react";
import { Card } from "./Card";
import {
  DotsVerticalIcon,
  EyeOffIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const DashboardWidget = ({ title, children, onHide, onMoveUp, onMoveDown }) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMoveUp}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onHide}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOffIcon className="h-4 w-4" />
          </button>
        </div>
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
};

export default DashboardWidget;
