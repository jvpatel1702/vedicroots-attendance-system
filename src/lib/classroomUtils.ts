import { isWithinInterval, parseISO } from 'date-fns';

export interface StudentVacation {
    student_id: string;
    /** Start date of the vacation in YYYY-MM-DD format */
    start_date: string;
    /** End date of the vacation in YYYY-MM-DD format */
    end_date: string;
}

export interface SchoolHoliday {
    id?: string;
    organization_id: string;
    name: string;
    /** Start date of the holiday in YYYY-MM-DD format */
    start_date: string;
    /** End date of the holiday in YYYY-MM-DD format */
    end_date: string;
}

/**
 * Checks if a specific student is on vacation for a given date.
 * 
 * @param studentId - The ID of the student to check.
 * @param vacations - List of all student vacations.
 * @param date - The date to check (defaults to today).
 * @returns True if the student is on vacation, false otherwise.
 */
export function isStudentOnVacation(
    studentId: string,
    vacations: StudentVacation[],
    date: Date = new Date()
): boolean {
    const vacation = vacations.find(v => v.student_id === studentId);
    if (!vacation) return false;

    return isWithinInterval(date, {
        start: parseISO(vacation.start_date),
        end: parseISO(vacation.end_date)
    });
}

/**
 * Checks if a given date falls within any school holiday.
 * 
 * @param date - The date to check.
 * @param holidays - List of school holidays.
 * @returns The holiday object if found, otherwise null.
 */
export function isDateHoliday(
    date: Date,
    holidays: SchoolHoliday[]
): SchoolHoliday | null {
    const holiday = holidays.find(h =>
        isWithinInterval(date, {
            start: parseISO(h.start_date),
            end: parseISO(h.end_date)
        })
    );
    return holiday || null;
}
