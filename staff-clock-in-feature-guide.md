# Staff Clock-In System - Quick Reference

## Essential Information At-a-Glance

### Key Features
1. ✅ **QR Code Clock-In**: Permanent QR code for staff scanning
2. ✅ **Automatic Break Deduction**: 30min break auto-deducted for shifts ≥5.5 hours
3. ✅ **Pay Period Management**: Weekly/Bi-weekly/Semi-monthly/Monthly tracking
4. ✅ **Location Verification**: Optional GPS check (PWA compatible)
5. ✅ **Leave Integration**: Approved leave auto-marks attendance
6. ✅ **Payroll Reports**: Excel/CSV/PDF exports by pay period

### Quick Decision Matrix

| If Staff... | Then System... |
|-------------|----------------|
| Scans QR at school | Auto clocks in, records time & location |
| Forgets phone | Admin manually enters attendance |
| Works >5.5 hours | Auto deducts 30min break |
| Works through break | Admin overrides (with reason) |
| Forgets to clock out | Auto clocks out at midnight (scheduled time + 30min) |
| On approved leave | Auto-marked "on leave", no clock-in needed |
| Arrives late | Status = "late", records minutes late |

### Admin Quick Actions

**Daily Tasks:**
- `/office/staff-attendance` - View who's clocked in today
- Click "Manual Entry" for staff who forgot to clock in
- Review and approve leave requests

**Pay Period Tasks:**
- `/admin/pay-periods` - View current period
- Click "Close Period" when ready for payroll
- Export payroll report (Excel/CSV)

**Staff Profile Tasks:**
- `/admin/staff/:id` → "Attendance" tab
- View all clock-ins for selected pay period
- Edit individual records if needed
- See summary (days worked, hours, late days)

### Critical Database Tables

1. **staff_attendance** - Main attendance records
2. **pay_periods** - Pay period definitions
3. **staff_schedules** - Weekly schedules per staff
4. **leave_requests** - Leave workflow
5. **school_qr_config** - QR code configuration

### API Endpoints (Most Used)

```
POST   /api/staff/clock-in          - Staff clocks in
POST   /api/staff/clock-out         - Staff clocks out
GET    /api/pay-periods/current     - Get current pay period
GET    /api/admin/staff-attendance/pay-period/:id - Get all attendance for period
POST   /api/admin/staff-attendance/manual - Manual entry
PATCH  /api/admin/staff-attendance/:id - Edit record
```

### Common Scenarios

**Scenario 1: New Pay Period Setup**
1. Go to `/admin/settings/pay-periods`
2. Select frequency (Weekly recommended)
3. Set start date
4. Click "Generate Periods for 2026"
5. Done!

**Scenario 2: Print QR Code**
1. Go to `/admin/settings/qr-code`
2. Click "Download PNG"
3. Print on A4 paper
4. Laminate and post at entrance
5. One-time setup!

**Scenario 3: Generate Payroll Report**
1. Go to `/admin/pay-periods`
2. Click "View Details" on desired period
3. Click "Export Payroll Report"
4. Download Excel file
5. Send to finance team

**Scenario 4: Staff Worked Through Break**
1. Staff informs you verbally
2. Go to `/admin/staff/:id` → Attendance tab
3. Find the date, click "Edit"
4. Toggle "Break Deducted" to "No"
5. Enter reason (required)
6. Save

### Troubleshooting

| Problem | Solution |
|---------|----------|
| QR not scanning | Check camera permissions, use GPS fallback, or manual entry |
| Location not working | Make it optional in settings, QR is primary verification |
| Forgot to clock out | Auto clock-out at midnight handles this |
| Wrong pay period assigned | System auto-assigns based on date |
| Need to edit closed period | Use "Unlock" feature with reason |

### Configuration Checklist

Before Launch:
- [ ] Configure pay period frequency
- [ ] Generate pay periods for current year
- [ ] Set up staff schedules (weekly times)
- [ ] Generate and print QR code
- [ ] Set school location (optional)
- [ ] Initialize leave balances
- [ ] Test with 3-5 staff members
- [ ] Train office admin on manual entry

### Security Notes

- QR code is permanent (not daily rotating)
- Combined with optional location check
- Rate limited (max 5 scans/hour/device)
- Admin actions logged in audit trail
- All times stored in UTC, displayed in local
- Location data stored as lat/lng only

### File Structure

```
/src
  /app
    /api
      /staff
        /clock-in - POST endpoint
        /clock-out - POST endpoint
      /admin
        /staff-attendance - Admin endpoints
      /pay-periods - Pay period endpoints
    /admin
      /staff/[id] - Staff profile with attendance tab
      /pay-periods - Pay period management
      /settings
        /pay-periods - Configuration
        /qr-code - QR generation
        /location - Location settings
    /office
      /staff-attendance - Daily view
    /teacher
      - Dashboard with clock-in widget
```

### Maintenance Tasks

**Daily (Automated via Cron):**
- Auto clock-out for forgotten staff (midnight)
- Cache pay period statistics

**Weekly:**
- Review clock-in patterns
- Check for anomalies

**Monthly:**
- Close previous pay period
- Generate payroll reports
- Verify leave balance accuracy

**Yearly:**
- Generate pay periods for new year
- Reset leave balances (Jan 1)

### Support Resources

**For Staff:**
- Can't clock in? Contact office for manual entry
- Forgot to clock out? No action needed (auto clock-out)
- Need leave? Submit request via app

**For Admin:**
- Full documentation: `staff_clockin_specification.md`
- Database schema: See main doc Section 8
- API docs: See main doc Section 9

---

**Document Version:** 1.0
**Last Updated:** February 10, 2026
**Maintained By:** System Admin