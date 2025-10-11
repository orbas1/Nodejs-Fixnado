# Screen Logic Flow Map — Phone Application v1.00

The following textual map describes the directed graph of screen transitions. Nodes represent screens; edges indicate navigation actions with guard conditions.

```
[Splash]
  ├─(token valid & compliance ok)→ [ExploreHome]
  └─(else)→ [Login]
[Login]
  ├─(auth success & profileComplete=false)→ [OnboardingCarousel]
  ├─(auth success & profileComplete=true)→ [ExploreHome]
  ├─(tap Forgot)→ [PasswordResetWebview]
  └─(tap Register)→ [RegistrationWizard]
[OnboardingCarousel]
  └─(Get Started)→ [PermissionsRequest]
[PermissionsRequest]
  ├─(Allow location)→ [ExploreHome]
  └─(Skip)→ [ExploreHome] (with limited functionality banner)

[ExploreHome]
  ├─(Search focus)→ [SearchResults]
  ├─(Filter)→ [FilterDrawer]
  ├─(Select provider)→ [ProviderDetailSheet]
  ├─(Open Marketplace tab)→ [MarketplaceHome]
  ├─(Open Messages tab)→ [MessagesList]
  ├─(Open Bookings tab)→ [BookingsOverview]
  └─(Open Profile tab)→ [ProfileOverview]
[ProviderDetailSheet]
  ├─(Book Now)→ [BookingStep1]
  ├─(Chat)→ [ChatDetail]
  └─(Save)→ [SavedProvidersToast]
[FilterDrawer]
  └─(Apply)→ [ExploreHome] (refresh data)

[BookingStep1]
  ├─(Next)→ [BookingStep2]
  └─(Back)→ [ProviderDetailSheet]
[BookingStep2]
  ├─(Next)→ [BookingStep3]
  └─(Back)→ [BookingStep1]
[BookingStep3]
  ├─(Pay success)→ [BookingSuccess]
  ├─(Pay failure)→ [BookingStep3Error]
  └─(Back)→ [BookingStep2]
[BookingStep3Error]
  ├─(Change method)→ [PaymentMethodSheet]
  ├─(Retry)→ [BookingStep3]
  └─(Cancel)→ [BookingStep1]
[BookingSuccess]
  ├─(View booking)→ [BookingDetail]
  └─(Back to Explore)→ [ExploreHome]

[MarketplaceHome]
  ├─(Select campaign)→ [CampaignDetail]
  ├─(Pull to refresh)→ [MarketplaceHome] (reload)
  └─(Menu)→ [PromotionWizard]
[CampaignDetail]
  ├─(Activate)→ [PromotionWizard]
  └─(Share)→ [NativeShareSheet]

[MessagesList]
  ├─(Tap conversation)→ [ChatDetail]
  ├─(Compose new)→ [NewMessage]
  └─(Filter)→ [MessageFilters]
[ChatDetail]
  ├─(Back)→ [MessagesList]
  ├─(Open booking)→ [BookingDetail]
  └─(Open attachments)→ [AttachmentPreview]

[ProfileOverview]
  ├─(Personal Info)→ [ProfileDetail]
  ├─(Payment Methods)→ [PaymentMethods]
  ├─(Preferences)→ [PreferenceSettings]
  ├─(Documents)→ [DocumentsVault]
  ├─(Settings)→ [Settings]
  └─(Provider Switch)→ [ProviderDashboard]
[DocumentsVault]
  ├─(Upload)→ [FilePicker]
  └─(Preview)→ [DocumentPreview]

[Settings]
  ├─(Notifications)→ [NotificationSettings]
  ├─(Security)→ [SecuritySettings]
  ├─(Language)→ [LanguageSelector]
  ├─(Theme)→ [ThemeToggle]
  ├─(Delete account)→ [ConfirmDeleteDialog]
  └─(Logout)→ [ConfirmLogoutDialog]

[ProviderDashboard]
  ├─(Quick action: Start Job)→ [ActiveJobDetail]
  ├─(Quick action: Log Availability)→ [AvailabilityCalendar]
  ├─(Alert)→ [ComplianceCenter]
  └─(Analytics deep dive)→ [EarningsDetail]
[ComplianceCenter]
  ├─(Upload requirement)→ [DocumentUpload]
  └─(View policy)→ [PolicyWebview]

[NotificationsCenter]
  ├─(Select booking alert)→ [BookingDetail]
  ├─(Select compliance alert)→ [ComplianceCenter]
  ├─(Select marketplace alert)→ [CampaignDetail]
  └─(Clear all)→ [ConfirmClearDialog]

[AccountRecovery]
  ├─(Reset via email)→ [PasswordResetWebview]
  ├─(Contact support)→ [SupportCentre]
  └─(Back)→ [Login]

[OfflineBanner]
  ├─(Retry tapped & success)→ [PreviousScreen]
  └─(Retry tapped & fail)→ [OfflineBanner] (show toast "Still offline")
```

### Notes
- Each node inherits theming and locale context from parent Navigator.
- Dialog nodes (`ConfirmDeleteDialog`) are modal overlays dismissed via `Navigator.pop(result)`.
- `SavedProvidersToast` is ephemeral (2.5s) and does not create a navigation entry.
