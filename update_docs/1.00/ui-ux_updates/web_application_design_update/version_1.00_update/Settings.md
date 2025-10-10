# Settings Architecture — Web Application v1.00

## Sections
1. **Profile** — personal info, company data, avatar upload.
2. **Notifications** — email, SMS, push preferences per channel.
3. **Security** — password, MFA, API tokens, login history.
4. **Billing** — payment methods, invoices, subscription tier.
5. **Integrations** — third-party connections (Calendar, CRM).
6. **Danger Zone** — deactivate account, export data.

## Data Model
| Section | Endpoint |
| --- | --- |
| Profile | GraphQL `updateProfile` mutation |
| Notifications | `updateNotificationSettings` |
| Security | `updatePassword`, `toggleMFA`, `revokeSessions` |
| Billing | `updatePaymentMethod`, `downloadInvoice` |
| Integrations | `connectIntegration`, `disconnectIntegration` |
| Danger Zone | `requestDataExport`, `deactivateAccount` |

## Interaction Rules
- Save buttons disabled until changes made. Auto-save for toggles.
- Avatar upload uses dropzone (max 5MB) with preview.
- MFA enabling requires QR code modal + recovery code download.
- Data export triggers email with link; show status indicator.

## Layout
- Tabs horizontal on desktop, convert to dropdown on mobile.
- Content width 960px max with 32px padding.
- Summary banner at top showing subscription level and renewal date.

## Accessibility
- Provide `aria-live` notifications for save success/failure.
- Danger actions include confirm modal with typed confirmation.
