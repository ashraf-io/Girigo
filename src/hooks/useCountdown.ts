import { useState, useEffect } from 'react';

interface TimeLeft {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useCountdown = (deadlineIso: string | undefined, createdAt?: number) => {
  // Start with Infinity so it's never falsely "expired" on initial render
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ total: Infinity, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    if (!deadlineIso) {
      setTimeLeft({ total: Infinity, days: 0, hours: 0, minutes: 0, seconds: 0 });
      setPercentage(100);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(deadlineIso) - +new Date();
      let tl: TimeLeft = { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        tl = {
          total: difference,
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return tl;
    };

    const updateTimer = () => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);

      const deadlineTime = +new Date(deadlineIso);
      const startTime = createdAt ? createdAt : deadlineTime - (24 * 60 * 60 * 1000);
      const totalDuration = deadlineTime - startTime;

      if (totalDuration > 0) {
        const pct = (tl.total / totalDuration) * 100;
        setPercentage(Math.max(0, Math.min(100, pct)));
      } else {
        setPercentage(0);
      }
    };

    updateTimer(); // Run immediately
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [deadlineIso, createdAt]);

  return { timeLeft, percentage };
};