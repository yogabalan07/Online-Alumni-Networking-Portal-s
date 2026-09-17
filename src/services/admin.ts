import type { StatKey } from './stats';
import { getStats } from './stats';

export type { StatKey } from './stats';
export { incrementStat } from './stats';

export interface PlatformStats {
  students: number;
  alumni: number;
  verifiedAlumni: number;
  activeUsers: number;
  connections: number;
  messages: number;
  jobs: number;
  internships: number;
  events: number;
  totalUsers: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const raw = await getStats();
  return {
    students: raw.students ?? 0,
    alumni: raw.alumni ?? 0,
    verifiedAlumni: raw.verifiedAlumni ?? 0,
    activeUsers: raw.totalUsers ?? 0,
    connections: raw.connections ?? 0,
    messages: raw.messages ?? 0,
    jobs: raw.jobs ?? 0,
    internships: raw.internships ?? 0,
    events: raw.events ?? 0,
    totalUsers: raw.totalUsers ?? 0,
  };
}

export function statKeys(): StatKey[] {
  return [
    'students',
    'alumni',
    'verifiedAlumni',
    'connections',
    'messages',
    'jobs',
    'internships',
    'events',
  ];
}