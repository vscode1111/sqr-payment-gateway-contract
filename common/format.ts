import dayjs, { Dayjs } from 'dayjs';

export function formatDate(date: Date | Dayjs) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}
