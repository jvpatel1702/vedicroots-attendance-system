import { isAfter } from 'date-fns';

export type GradeType = 'KINDERGARTEN' | 'ELEMENTARY';

export interface SchoolSettings {
    cutoff_time_kg: string;        // "09:15:00"
    cutoff_time_elementary: string; // "09:00:00"
}

/**
 * Checks if the current time is past the cutoff for the given grade type.
 */
export function isPastCutoff(
    gradeType: GradeType,
    settings: SchoolSettings,
    currentTime: Date = new Date()
): boolean {
    const cutoffString = gradeType === 'KINDERGARTEN'
        ? settings.cutoff_time_kg
        : settings.cutoff_time_elementary;

    if (!cutoffString) return false;

    // Parse cutoff string "HH:MM:SS" into a Date object for today
    const [hours, minutes, seconds] = cutoffString.split(':').map(Number);
    const cutoffDate = new Date(currentTime);
    cutoffDate.setHours(hours, minutes, seconds || 0, 0);

    return isAfter(currentTime, cutoffDate);
}

/**
 * Determines allowed actions based on time logic.
 */
export function getAllowedAttendanceActions(
    gradeType: GradeType,
    settings: SchoolSettings,
    currentTime: Date = new Date()
): { canMarkPresent: boolean; canMarkAbsent: boolean; canMarkLate: boolean } {
    const past = isPastCutoff(gradeType, settings, currentTime);

    if (past) {
        return {
            canMarkPresent: false, // Strict: Cannot mark present after cutoff (must be Late)
            canMarkAbsent: true,   // Can always mark absent? System docs say "Any unmarked student is considered Late" but implies absent is also possible if they are truly absent.
            // Actually docs say: "Once drop-off window ends: Teachers can ONLY mark students as Late."
            // But logic also says "Any unmarked student is considered Late or Absent".
            // Let's interpret "Only mark students as Late" strictly for arrivals.
            // But if a student never comes, they are Absent.
            // Let's allow LATE and ABSENT.
            canMarkLate: true
        };
    }

    return {
        canMarkPresent: true,
        canMarkAbsent: true,
        canMarkLate: true // Early late? Unlikely but harmless.
    };
}
