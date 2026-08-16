"use client";

import React, { useEffect, useState } from "react";

interface CountUpProps {
  end: number;
  duration?: number; // duration in ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <span>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
