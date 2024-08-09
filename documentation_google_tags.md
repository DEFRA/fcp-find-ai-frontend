## FFA Application Analytics Events

This document describes the analytics events implemented in the FFA application to track user interactions with key elements. The tracking is done using Google Analytics via `gtag.js`.

### Event Tracking Details

| Element               | Event Name      | Event Category              | Event Label              | Description                                                                 |
|-----------------------|-----------------|-----------------------------|--------------------------|-----------------------------------------------------------------------------|
| Copy Button           | `copy`          | Conversation Button Clicks  | `copy`                   | Triggered when the user clicks the copy button.                             |
| Print Button          | `print`         | Conversation Button Clicks  | `print`                  | Triggered when the user clicks the print button.                            |
| New Question Button   | `new question`  | Conversation Button Clicks  | `new question`           | Triggered when the user clicks the "New Question" button.                   |
| Send Button           | `conversation question` | Conversation Button Clicks  | `conversation question` | Triggered when the user submits a conversation question.                   |
| Scheme All Checkbox   | `scheme filtered all`  | Scheme Filter              | `enable/disable all`     | Triggered when the "Scheme All" checkbox is checked or unchecked.           |
| Scheme CS Checkbox    | `scheme filtered CS`   | Scheme Filter              | `enable/disable CS`      | Triggered when the "Scheme CS" checkbox is checked or unchecked.            |
| Scheme FETF Checkbox  | `scheme filtered FETF` | Scheme Filter              | `enable/disable FETF`    | Triggered when the "Scheme FETF" checkbox is checked or unchecked.          |
| Scheme SIG Checkbox   | `scheme filtered SIG`  | Scheme Filter              | `enable/disable SIG`     | Triggered when the "Scheme SIG" checkbox is checked or unchecked.           |
| Scheme SFI Checkbox   | `scheme filtered SFI`  | Scheme Filter              | `enable/disable SFI`     | Triggered when the "Scheme SFI" checkbox is checked or unchecked.           |
| Reset Form Submission | `new conversation`     | Conversation Button Clicks | `new conversation`       | Triggered when the user submits the reset form to start a new conversation. |

### Implementation Details

All buttons and checkboxes retain their primary functionality even when JavaScript is disabled, though analytics tracking will only be active when JavaScript is enabled.

#### Adding New Events

To add a new event, ensure the HTML element has a unique ID, and add a corresponding `onclick` or event listener function that calls the `trackConversationEvent` function with the appropriate parameters.

#### Google Analytics Setup

Ensure the Google Analytics script is included in your HTML and the correct `googleTagManagerKey` is provided:

```
<script async src="https://www.googletagmanager.com/gtag/js?id={{googleTagManagerKey}}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{{googleTagManagerKey}}');
  function trackConversationEvent(action) {
      gtag('event', action, {
          'event_category': 'Conversation Button Clicks',
          'event_label': action,
          'value': 1
      });
  }
</script>
```
