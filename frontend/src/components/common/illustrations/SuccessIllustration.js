import React from "react";
import Lottie from "react-lottie";
import successAnimation from "./lottie/success.json";

export const SuccessIllustration = ({ message = "Operation successful!" }) => {
  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: successAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <div className="w-32 h-32">
        <Lottie options={defaultOptions} />
      </div>
      <p className="mt-4 text-lg font-medium text-green-600">{message}</p>
    </div>
  );
};
