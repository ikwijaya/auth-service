import { type ICalendarEvent, type ILeaveData } from '@/dto/common.dto';

/**
 *
 * @param leave
 * @param startDate
 * @param endDate
 * @param id
 * @param title
 * @param reason
 * @param includeEndDate
 * @returns
 */
export async function useCalendarEvents(
  leave: ILeaveData,
  startDate: Date,
  endDate: Date,
  id: number,
  title: string,
  reason?: string,
  includeEndDate?: boolean
): Promise<ICalendarEvent[]> {
  const dates: ICalendarEvent[] = [];
  const currentDate = startDate;
  while (currentDate < endDate) {
    dates.push({
      id,
      title,
      date: new Date(currentDate),
      reason,
      leave,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (includeEndDate)
    dates.push({
      id,
      title,
      date: endDate,
      reason,
      leave,
    });

  return dates;
}
