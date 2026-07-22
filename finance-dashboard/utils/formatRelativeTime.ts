export function formatRelativeTime(timestamp: number) {
    const now = Date.now();
    const diff = now - timestamp;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return "Just now";
    }

    if (diff < hour) {
        const mins = Math.floor(diff / minute);
        return `${mins} min${mins > 1 ? "s" : ""} ago`;
    }

    if (diff < day) {
        const hrs = Math.floor(diff / hour);
        return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    }

    if (diff < day * 2) {
        return "Yesterday";
    }

    if (diff < day * 7) {
        const days = Math.floor(diff / day);
        return `${days} days ago`;
    }

    return new Date(timestamp).toLocaleDateString();
}