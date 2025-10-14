# Dummy Data Requirements

## Purpose
- Provide realistic sample data sets to support design prototyping, usability testing, and demo builds without exposing production information.

## Data Domains
1. **Provider Profiles**
   - Fields: Name, Role (Solo/Fleet), Certification list, Rating, Response time, Region, Languages, Availability summary.
   - Variations: At least 8 profiles covering diverse regions and performance levels; include flagged compliance cases.
2. **Jobs & Bookings**
   - Fields: Job ID, Client name, Location, Start/end dates, Equipment type, Payout, Status (Pending/Accepted/In Progress/Completed/Issue), Notes.
   - Provide 20 sample bookings spanning statuses to stress test timeline components.
3. **Financial Transactions**
   - Fields: Transaction ID, Type (Payout, Adjustment, Reimbursement), Amount, Fees breakdown, Scheduled date, Status, Linked job ID.
   - Include scenarios with withheld payouts and disputes for edge case coverage.
4. **Action Queue Items**
   - Fields: Task type, Priority, Due date, Description, Link target, Auto-generated suggestions.
   - Provide mix of compliance, scheduling, and support prompts.
5. **Support Resources**
   - Fields: Article title, Category, Summary, URL, Estimated read time, Related tags.
   - Prepare 15 entries to populate knowledge base sections.

## Data Format & Storage
- Use JSON fixtures stored in `design-data/application/` with modular files per domain.
- Ensure timestamps use ISO 8601; monetary values stored as integers (cents) to avoid rounding ambiguity.
- Include localisation-ready strings to test translation expansion (long names, multi-byte characters).

## Privacy & Compliance
- All dummy names and locations fictitious; avoid personally identifiable information resembling real customers.
- Document data generation process to ensure reproducibility and alignment with privacy policies.

## Update Cadence
- Review sample data every release to align with new features (e.g., additional fields, statuses).
- Coordinate with analytics team to validate that sample values mimic production ranges for credible demos.
