# meal-planner-app
This is my flutter app for meal-planning

## Alexa Integration Setup

To use the Alexa sync functionality, you need to set up your own Amazon Developer credentials:

1.  Copy `lib/config/secrets_template.dart` to `lib/config/secrets.dart`.
2.  Fill in your `clientId`, `clientSecret`, and `skillId` from the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask).
3.  Ensure your redirect URI in the console matches the one defined in `AlexaSecrets`.

**Note:** `lib/config/secrets.dart` and `.env` are excluded from version control to keep your credentials secure.

