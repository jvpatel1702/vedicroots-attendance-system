import { isWithinInterval, parseISO } from 'date-fns';

export interface StudentVacation {
    student_id: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
}

export interface SchoolHoliday {
    id?: string;
    organization_id: string;
    name: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
}

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
