export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Automobile Engineering',
  'MBA',
  'MCA',
  'B.Sc / M.Sc',
  'BCA',
  'BBA',
] as const;

export const YEARS = (() => {
  const current = new Date().getFullYear();
  const years: string[] = [];
  for (let y = current; y >= current - 25; y--) years.push(String(y));
  return years;
})();

export const SKILL_SUGGESTIONS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'React',
  'Node.js',
  'Flutter',
  'Machine Learning',
  'Data Science',
  'Cloud Computing',
  'DevOps',
  'UI/UX Design',
  'Project Management',
  'SQL',
  'Cybersecurity',
  'iOS',
  'Android',
  'Go',
  'Rust',
  'Communication',
  'Leadership',
  'Data Analysis',
] as const;

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Remote',
  'On-site',
  'Hybrid',
] as const;

export const EVENT_TYPES = [
  'Alumni Meet',
  'Career Guidance',
  'Technical Workshop',
  'Webinar',
  'Hackathon',
  'Seminar',
  'Networking Session',
  'Guest Lecture',
] as const;

export const REPORT_REASONS = [
  'Fake profile / impersonation',
  'Spam or misleading content',
  'Inappropriate behaviour',
  'Harassment or abuse',
  'Fraudulent job or internship post',
  'Other',
] as const;

export const ACCENT_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-fuchsia-500',
] as const;

export const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰',
  '😘', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😢', '😭', '😤',
  '🤯', '😱', '🤔', '🤗', '😴', '🤐', '😡', '👍', '👎', '👏',
  '🙏', '💪', '🤝', '👌', '✌️', '🤞', '❤️', '💜', '💙', '💚',
  '🎉', '🎊', '✨', '🔥', '💯', '🚀', '✅', '⭐', '🌈', '⚡',
] as const;

export const DEFAULT_PROFILE_IMAGE = '/avatar-placeholder.svg';