---
name: Match start-time display
description: The frontend contract for displaying match start times returned by the API.
---

Display the literal `HH:mm` encoded in a match start-time value. Do not convert it to the browser, server, or Berlin timezone.

**Why:** The API currently treats match start times as display-ready wall-clock values, even when a value includes a UTC marker. Timezone conversion changes the scheduled time shown to users.

**How to apply:** Extract and render the encoded hour and minute for match schedules. Revisit this only after the API adopts and documents an unambiguous timezone contract.