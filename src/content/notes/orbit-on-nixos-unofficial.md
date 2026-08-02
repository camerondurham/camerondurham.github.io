---
title: "Running OrBit on NixOS for My Polestar 2 (Unofficial)"
date: "2026-02-28"
summary: "Why I built a small Nix+Wine wrapper for OrBit, what it does, and where to find the scripts."
tags: ["nixos", "wine", "polestar", "automotive", "experiments"]
---

I wanted a repeatable way to run OrBit on my NixOS laptop and couldn't find a setup I trusted, so I wrote a small wrapper around Wine and a few network helpers.

My use case is a 2022 Polestar 2, mainly to rebuild/update modules and unlock Matrix LED behavior that appears in EU builds.

Repo:

- https://github.com/camerondurham/orbit-runner-flake

What's in it:

- `nix run .#orbit-start` to probe OBD Ethernet and then launch
- `nix run .#orbit-update` to run installer updates with a backup step
- `nix run .#orbit-rollback` to restore the last known-good Wine prefix

This is unofficial and experimental. If you try it, use caution and make sure you're comfortable with the legal/warranty/safety implications in your region.
