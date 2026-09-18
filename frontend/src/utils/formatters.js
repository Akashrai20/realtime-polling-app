// Format seconds into digital countdown format HH:MM:SS or MM:SS
export const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return '00:00';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Calculate vote percentage breakdown for poll options
export const calculatePercentages = (options = []) => {
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  
  return options.map((opt) => {
    const votes = opt.votes || 0;
    const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
    return {
      ...opt,
      votes,
      percentage: parseFloat(percentage),
    };
  });
};

// Calculate remaining time from expiry date ISO string
export const getRemainingSeconds = (expiryDate) => {
  if (!expiryDate) return 0;
  const now = new Date().getTime();
  const target = new Date(expiryDate).getTime();
  const diff = Math.floor((target - now) / 1000);
  return diff > 0 ? diff : 0;
};

// Format relative date string (e.g. "2 hours ago")
export const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};
