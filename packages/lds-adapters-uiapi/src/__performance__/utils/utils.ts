export const MEDIAN_BATCH_THRESHOLD = 2000; // Experimentally measured to be around 1000, give some wiggle room

export interface Measurement {
    time: number;
    memory: number;
}

export function median(arr: number[]) {
    const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}
