# Screen Flow Map — Web Application v1.00

```
[Landing]
  -> (search submit) [Explorer]
  -> (cta become provider) [ProviderSignup]
[Explorer]
  -> (select provider) [ProviderModal]
  -> (book now) [BookingWizard]
  -> (save provider) [AccountFavorites]
  -> (switch to marketplace) [Marketplace]
[ProviderModal]
  -> (view full profile) [ProviderProfile]
  -> (start chat) [Messages]
  -> (close) back to [Explorer]

[BookingWizard]
  -> Step1 Details
  -> Step2 Schedule
  -> Step3 Payment
  -> Success -> [BookingConfirmation]
  -> Cancel -> [Explorer]

[DashboardUser]
  -> (nav bookings) [Bookings]
  -> (nav marketplace) [Marketplace]
  -> (nav settings) [Settings]
  -> (nav notifications) [NotificationsDrawer]

[Bookings]
  -> (select row) [BookingDetailModal]
  -> (bulk action export) [ExportDialog]

[Marketplace]
  -> (activate campaign) [CampaignWizard]
  -> (view analytics) [MarketplaceAnalytics]

[DashboardProvider]
  -> (quick action start job) [JobDetail]
  -> (open compliance) [ComplianceCenter]
  -> (open bidding) [BiddingConsole]

[ComplianceCenter]
  -> (upload doc) [UploadModal]
  -> (view policy) [PolicyDrawer]

[Settings]
  -> (tab profile) [SettingsProfile]
  -> (tab notifications) [SettingsNotifications]
  -> (tab security) [SettingsSecurity]
  -> (danger delete) [ConfirmDeleteDialog]

[NotificationsDrawer]
  -> (click booking alert) [BookingDetailModal]
  -> (click compliance alert) [ComplianceCenter]
  -> (mark all read) update state

[Messages]
  -> (open conversation) [ConversationThread]
  -> (new message) [ComposeDrawer]
```

### Notes
- Routes mirror Next.js file structure (e.g., `/dashboard/provider/bidding`).
- Modals implemented with `next/router` shallow routes for deep linking.
- Drawer components overlay content but maintain accessible focus trap.
