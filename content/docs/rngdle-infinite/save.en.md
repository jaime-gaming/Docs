---
description: "Where the save lives, how to link another device and what the caveats of linking are."
updated: "2026-10-18"
---

## Where the save lives

**Your save is stored in your browser**, in `localStorage`. There is no account, no server holding your progress and no login.

The direct consequences:

| Situation | What happens |
| --- | --- |
| You switch browser | The save does not follow you: it is a different storage |
| You use private browsing | When you close it, the save is gone |
| You clear the site's data | The save is deleted |
| You use another device | It has to be linked explicitly |
| A different URL of the same game | It is another origin, so it is another save |

## Linking another device

To play on another device:

1. Open **Settings → Device link** on the device that already has the save.
2. Open the link, or scan the **QR code**, on the other device.

> [!DANGER]
> **Anyone with the link can play with your account.** Keep it private: do not publish it, do not paste it into a public chat and do not share it in a screenshot where it is visible.

## How the sync works

Once two devices are linked **and both are open**, they stay in sync.

The device that **created the link is the primary one**: it is the one running the rolls and the purchases. That way the two screens **never fight over the same roll**.

```text
primary device ──► runs rolls and purchases
       │
       └──► syncs with ──► secondary device (open)
```

What follows from that design:

- With the secondary **closed** there is no sync in progress; reopening it catches up.
- Rolls and purchases are resolved on the primary, so there are no write conflicts between the two screens.
- The link does not upload your save to any server: it is a direct connection between the two devices.

## Recommendations

1. **Treat the link like a password.** In practice, that is what it is.
2. **Keep the primary device as the reference.** If something does not add up between screens, the primary is the one that counts.
3. **Be careful when clearing browser data**: there is no cloud copy to recover.
4. **If you share a machine**, remember the save stays in that machine's browser profile.
