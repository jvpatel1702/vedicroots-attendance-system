# VR App – Classroom & Attendance System Documentation

**Academic Year:** 2025–2026  
**School Year Start Date:** September 1, 2025  
**School Year End Date:** June 26, 2026

---

## 1. Classroom System

The school operates with **four classrooms**, grouped by grade levels and assigned teaching staff.

### 1.1 Classroom Structure

| Classroom | Grades | Assigned Teachers |
|----------|--------|-------------------|
| KG 1 | Junior Kindergarten (JK) & Senior Kindergarten (SK) | 2 |
| KG 2 | Junior Kindergarten (JK) & Senior Kindergarten (SK) | 2 |
| Lower Elementary | Grades 1–3 | 2 |
| Upper Elementary | Grades 4–6 and Grade 7 | 1 |

**Notes:**
- Kindergarten students (JK and SK) are split between **KG 1** and **KG 2**.
- **Grade 8** is not offered in the 2025–2026 academic year and will be introduced the following year as the school grows with its first batch.

---

## 2. Attendance System Overview

Attendance is recorded daily by teachers through the VR App and is governed by **time-based rules** depending on the student category:
- Kindergarten (JK–SK)
- Elementary (Grade 1 and above)

### Attendance Statuses
- **Present**
- **Absent**
- **Late**

Attendance must be completed for **all students** in a classroom before teachers can submit and sign off.

---

## 3. School Timings

### 3.1 Elementary (Grades 1+)

**Regular School Hours:** 8:15 AM – 3:15 PM  

**Drop-off Window:** 8:15 AM – 9:00 AM  
**Pickup Window:** 3:15 PM – 3:25 PM  

**Rules:**
- Students arriving **after 9:00 AM** are marked **Late** or **Absent**.
- Pickup after **3:25 PM** is considered a **Late Pickup**.
- Late pickup fees are charged at **$1 per minute**, added to the monthly invoice.

#### Elementary Early-Care
- **Early-Care Window:** 7:15 AM – 8:15 AM
- Students enrolled in early care may arrive **anytime after their approved early-care start time**.
- Early-care students may also arrive during the regular drop-off window if preferred.

---

### 3.2 Kindergarten (JK–SK)

**Regular School Hours:** 8:45 AM – 3:30 PM  

**Drop-off Window:** 8:45 AM – 9:15 AM  
**Pickup Window:** 3:30 PM – 3:40 PM  

**Rules:**
- Students arriving **after 9:15 AM** are marked **Late** or **Absent**.
- Pickup after **3:40 PM** is considered a **Late Pickup**.
- Late pickup fees are charged at **$1 per minute**, added to the monthly invoice.

#### Kindergarten Early-Care
- **Early-Care Window:** 7:15 AM – 8:45 AM
- Students enrolled in early care may arrive anytime after their approved early-care start time.
- Early-care students may also arrive during the regular drop-off window if preferred.

---

## 4. Attendance App Behaviour

### 4.1 Attendance Time Logic

- Attendance can be taken from **early-care start time** until the **end of the drop-off window**.
- During this period, teachers may mark students as:
  - **Present**
  - **Absent**
- Once the drop-off window ends:
  - Any unmarked student is considered **Late**.
  - Teachers can **only mark students as Late**.
  - The system records the **exact time** the student is marked late for reporting purposes.

---

### 4.2 Attendance Completion & Submission

- Teachers **cannot submit attendance** until **every student** is marked as:
  - Present
  - Absent
  - Late
- Once all students are marked, the **Submit Attendance** option becomes available.

---

## 5. Teacher App Interface & Actions

### 5.1 Student List Visibility

- Teachers see a list of **all students assigned to their classroom**.
- Students marked as **on vacation** are:
  - Excluded from the active list, or
  - Displayed in a disabled (non-interactive) state.

---

### 5.2 Swipe Actions

**During Early-Care & Drop-off Period:**
- **Right Swipe:** Mark student as **Present** and move them down the list.
- **Left Swipe:** Mark student as **Absent**.
- Swiping allows teachers to easily correct accidental markings.

**After Drop-off Period:**
- **Right or Left Swipe:** Marks student as **Late**.
- Late marking automatically logs the time of entry.

---

## 6. Multi-Teacher Syncing

- Classrooms with multiple teachers use **real-time synchronization**.
- When one teacher marks attendance for a student:
  - The update is immediately visible on all other teachers’ devices for the same classroom.
- This prevents duplicate work and conflicting attendance records.

---

## 7. Vacation Management (Office Team)

- The **Office Team** manages student vacation records.
- Vacation entries include:
  - Start date (From)
  - End date (To)

### System Behaviour
- Students on vacation do **not appear** (or appear disabled) in teacher attendance lists during the vacation period.
- Vacation status automatically expires after the end date.

---

## 8. Lunch Count & Kitchen Coordination

- At **10:30 AM**, the office team generates a daily report containing:
  - Number of **students present**
  - Number of **adults present**
- This data is shared with the **Kitchen Team** to prepare lunch accordingly.

---

## 9. Key App Design Considerations

This documentation defines core requirements for the VR App, including:
- Role-based access (Teacher, Office Team)
- Time-based attendance state changes
- Gesture-driven attendance marking
- Real-time multi-device synchronization
- Vacation-based student visibility
- Automated late pickup fee tracking
- Daily operational reporting for kitchen planning

---

*This document serves as the authoritative system specification for the VR App’s classroom and attendance workflows.*
