---
description: "Where the save lives, how to link another device, which transport the link uses and what precautions it has."
updated: "2026-10-18"
---

## Where the save lives

**Your save lives in your browser**, in `localStorage`. There is no account, no server holding your progress, no sign-in: the game has no backend.

All state (EP, badges, companions, skills, rebirths, prestiges and history) is serialized into a single blob under the `PROGRESS_KEY` key, handled by `src/progress.js`. That same module owns the **save format and the migrations**: when a new version adds fields, the older save is updated on open instead of being thrown away.

The direct consequences of living in the browser:

| Situation | What happens |
| --- | --- |
| You switch browser | The save does not follow you: it is a different store |
| You use private browsing | The save disappears when you close it |
| You clear site data | The save is deleted |
| You use another device | It has to be linked explicitly |
| Another URL of the same game | Different origin, so a different save |
| You update the game | The migration keeps what you had |

> [!NOTE]
> Having no account has a real upside: nobody can read your progress from a server, because there is no such server. The cost is that **there is also no cloud copy to recover** if you clear your browser data.

## Linking another device

To play on another device:

1. Open **Settings → Device link** on the device that already has the save.
2. Open the link, or scan the **QR code**, on the other device.

> [!DANGER]
> **Anyone with the link can play your account.** Keep it private: do not publish it, do not paste it into a public chat, and do not share a screenshot where it is visible. For practical purposes, the link is a password.

## Who is in charge with two screens

The device that **created the link is the main one** and holds slot `a`; the device that joined is the secondary and holds slot `b`.

- The main device **dials**; the secondary **listens**.
- While both are connected, actions started on the secondary **are sent to the main one to run once**.

That split is what keeps the two screens from **ever fighting over the same roll**: there is a single executor, even though there are two interfaces.

```text
secondary (b) ──► action started here
                      │
                      ▼
              main (a) ──► runs it once
                      │
                      ▼
          synced state ──► both screens
```

What follows from the design:

- With the secondary **closed** there is no sync in progress; it catches up when reopened.
- Rolls and purchases always resolve on the main device, so there are no write conflicts.
- If you close the main device, the link stops executing actions until it comes back.

## The two transports

The link (`src/sync.js`) does not always take the same path: it chooses based on where the game is hosted.

| Hosting | Transport | Why |
| --- | --- | --- |
| Development, or anywhere a relay is configured | Own **relay** | A memory-only or on-disk store holding the latest save blob |
| Static hosting (GitHub Pages) | **PeerJS over WebRTC** | There is no server of your own; the public broker **only does the handshake** |

> [!IMPORTANT]
> On the WebRTC transport **the save never passes through the broker**. The broker introduces the two devices and steps aside; the blob travels device to device. This is an explicit design decision of the project and it stays that way on purpose.

In development, the Vite server itself serves the relay at `/__sync/*`, so there is nothing extra to set up to test the link.

### Timings and reconnection

The link has a heartbeat and recovers on its own:

| Timer | Value | What it means |
| --- | --- | --- |
| Heartbeat | 3 s | How often it checks the other side is still there |
| Pong timeout | 12 s | How long it waits for a reply before calling the link down |
| Reconnect backoff | 2.5 s → 30 s | Retries spaced further apart, with a ceiling |

Beyond the backoff, **regaining the network or returning to a visible tab retries at once**, without waiting for the next cycle. That is what makes the link recover by itself when you come back from airplane mode or switch tabs.

## Advanced settings

Two `localStorage` keys let you replace the endpoints of the link. They are for development and testing; normal play never needs them.

| Key | What it is for |
| --- | --- |
| `rng-infinite-peer-broker` | Replace the PeerJS broker with `{host, port, path, secure}` |
| `rng-infinite-sync-endpoint-v1` | Replace the relay URL (development only) |

> [!WARNING]
> If you bring up a local `peer` server for the WebRTC tests, use **port 9000**. Port 9123 is blocked by Chromium (`ERR_UNSAFE_PORT`) and the link will fail without an obvious message.

## Recommendations

1. **Treat the link like a password.** That is what it is in practice.
2. **Keep the main device as the reference.** If something does not add up between screens, the main one wins.
3. **Be careful clearing browser data**: there is no cloud copy to recover.
4. **If you share a machine**, remember the save stays in that machine's browser profile.
5. **Keep both tabs open** while you want active sync: with one closed there is no link in progress.
6. **If the link does not come up**, check the network and tab visibility first: both trigger an immediate retry.
