# Screen Text & Copy Framework — Phone Application v1.00

## Tone & Voice
- Confident, professional, supportive. Avoid jargon; prefer action-oriented verbs.
- Use sentence case except for navigation labels (title case) and section headings (title case).
- Provide localisation keys for each string in `strings_en.arb` with prefix `phone_`.

## Key Screens Copy Deck (EN-US)
| Key | Default Text | Notes |
| --- | --- | --- |
| `phone_login_title` | "Welcome back" | Displayed on login form card |
| `phone_login_subtitle` | "Sign in to manage your Fixnado services" | Body text 16/24 |
| `phone_login_primary_button` | "Sign in" | Primary button |
| `phone_login_secondary_button` | "Create account" | Ghost button |
| `phone_onboarding_slide1_title` | "Expand with geo-zones" | |
| `phone_onboarding_slide1_body` | "Discover providers by dynamic service zones tailored to you." | |
| `phone_onboarding_cta` | "Get started" | Primary CTA |
| `phone_explore_search_placeholder` | "Search services, providers, or zones" | 1 line max |
| `phone_explore_zone_ribbon_title` | "Zone insights" | |
| `phone_provider_card_cta_primary` | "Book now" | |
| `phone_provider_card_cta_secondary` | "Chat" | |
| `phone_booking_stepper_title` | "Secure your booking" | Stepper header |
| `phone_booking_summary_title` | "Review & confirm" | |
| `phone_payment_success_title` | "You're booked!" | |
| `phone_payment_success_body` | "We sent a confirmation to your inbox and chat." | |
| `phone_marketplace_tab_services` | "Services" | Segmented control |
| `phone_marketplace_banner_cta` | "Activate offer" | |
| `phone_messages_empty_title` | "Start the conversation" | |
| `phone_messages_empty_body` | "You have no messages yet. Reach out to providers to begin." | |
| `phone_profile_header_title` | "Hi, {firstName}" | Personalised; fallback "Hi there" |
| `phone_settings_section_notifications` | "Notifications" | |
| `phone_settings_danger_signout` | "Sign out" | Destructive |
| `phone_compliance_progress_title` | "Stay compliant" | |
| `phone_compliance_pending_badge` | "Pending" | |
| `phone_offline_banner` | "Offline mode. Some actions are unavailable." | |
| `phone_profile_loyalty_title` | "Loyalty tier" | Metric card label |
| `phone_profile_complete_prompt` | "Finish your business profile to unlock analytics." | Banner text |
| `phone_payment_add_method` | "Add payment method" | Button label |
| `phone_payment_default_badge` | "Default" | Badge text |
| `phone_settings_language` | "Language" | Settings tile label |
| `phone_settings_theme_auto` | "Match system" | Option label |
| `phone_settings_mfa_title` | "Two-factor authentication" | Toggle label |
| `phone_settings_mfa_description` | "Add a second step to secure your account." | Subtitle |
| `phone_compliance_upload_cta` | "Upload document" | Button |
| `phone_compliance_due_by` | "Due {date}" | Placeholder uses locale formatting |
| `phone_compliance_verified_badge` | "Verified" | |
| `phone_marketplace_empty_title` | "No offers yet" | Empty state |
| `phone_marketplace_empty_body` | "Check back soon or adjust your filters." | |
| `phone_messages_quick_reply_label` | "Suggested replies" | Section title |
| `phone_notifications_clear_all` | "Clear all" | Button |
| `phone_notifications_empty` | "You're all caught up" | Empty state |
| `phone_provider_dashboard_start_job` | "Start job" | Quick action |
| `phone_provider_dashboard_log_availability` | "Log availability" | Quick action |
| `phone_provider_dashboard_launch_campaign` | "Launch campaign" | Quick action |
| `phone_provider_dashboard_section_jobs` | "Job pipeline" | Section heading |
| `phone_provider_dashboard_section_metrics` | "Performance insights" | Section heading |
| `phone_provider_dashboard_compliance_card_title` | "Compliance tracker" | Card heading |
| `phone_provider_dashboard_compliance_body` | "{pendingCount} items need attention" | Body |
| `phone_error_dialog_title` | "Something went wrong" | Dialog title |
| `phone_error_dialog_body` | "We couldn't complete that action. Try again or contact support." | Dialog body |
| `phone_error_contact_support` | "Contact support" | Ghost button |
| `phone_success_toast_booking` | "Booking confirmed" | Toast |
| `phone_success_toast_saved` | "Saved for later" | Toast |
| `phone_offline_retry` | "Retry" | Button |
| `phone_tutorial_next` | "Next" | Coach mark button |
| `phone_tutorial_skip` | "Skip tour" | Coach mark button |

## Microcopy Rules
- **Buttons**: 1-2 words, start with verb. Avoid punctuation.
- **SnackBars**: 1 sentence max, present tense. Provide action labelled with verb ("Retry", "View").
- **Form Labels**: Title case, descriptive ("Business Name", "Preferred Languages"). Helper text provides 1 sentence context.
- **Error Messages**: Empathetic, solution oriented. Example: "Payment failed. Check your card details or try another method.".

## Dynamic Content Placeholders
- Use curly braces for placeholders (`{zoneName}`, `{providerCount}`). Provide fallback values in translation files.
- Currency formatted with locale-specific symbol using backend-supplied currency code.

## Accessibility Text
- Provide alternative text for imagery: e.g., `alt_provider_banner` = "Technician installing air conditioner".
- VoiceOver hints for buttons: `phone_button_book_hint` = "Opens booking steps for selected provider".

## Internationalisation Considerations
- Reserve 30% extra width for translated strings. Layout uses flexible containers to avoid truncation.
- Provide pseudo localization testing string: `「Ｐｈｏｎｅ Ｅｘｐｌｏｒｅ」` ensures accent + width support.
- All date/time strings rely on `intl` package with translation keys for format patterns.
