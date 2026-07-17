"""Validate the six normalized candy PNGs without rendering them."""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

import numpy as np
from PIL import Image


EXPECTED = ("coral", "amber", "lime", "aqua", "violet", "rose")


def main() -> int:
    repo = Path(__file__).resolve().parents[4]
    asset_dir = repo / "apps/web/src/features/game/ui/assets"
    issues: list[str] = []
    hashes: dict[str, str] = {}
    rows: list[tuple[str, str, str, str, str, str]] = []

    for kind in EXPECTED:
        path = asset_dir / f"candy-{kind}.png"
        if not path.is_file():
            issues.append(f"{kind}: missing {path}")
            continue

        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            mode = image.mode
            size = image.size
            rgba = np.asarray(image.convert("RGBA"))

        alpha = rgba[..., 3]
        visible_y, visible_x = np.where(alpha >= 8)
        if not len(visible_x):
            issues.append(f"{kind}: no visible subject")
            continue

        bounds = (
            int(visible_x.min()),
            int(visible_y.min()),
            int(visible_x.max()) + 1,
            int(visible_y.max()) + 1,
        )
        visible_size = (bounds[2] - bounds[0], bounds[3] - bounds[1])
        margins = (
            bounds[0],
            bounds[1],
            size[0] - bounds[2],
            size[1] - bounds[3],
        )
        corners = (
            int(alpha[0, 0]),
            int(alpha[0, -1]),
            int(alpha[-1, 0]),
            int(alpha[-1, -1]),
        )
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes[kind] = digest

        if mode != "RGBA":
            issues.append(f"{kind}: expected RGBA, got {mode}")
        if size != (512, 512):
            issues.append(f"{kind}: expected 512x512, got {size[0]}x{size[1]}")
        if (int(alpha.min()), int(alpha.max())) != (0, 255):
            issues.append(
                f"{kind}: expected alpha range 0..255, got "
                f"{int(alpha.min())}..{int(alpha.max())}"
            )
        if corners != (0, 0, 0, 0):
            issues.append(f"{kind}: corner alpha is not fully transparent: {corners}")
        if min(margins) < 32:
            issues.append(f"{kind}: subject is too close to canvas edge: {margins}")
        if not 416 <= max(visible_size) <= 424:
            issues.append(
                f"{kind}: normalized subject max edge is {max(visible_size)}, "
                "expected 416..424"
            )

        rows.append(
            (
                kind,
                f"{size[0]}x{size[1]} {mode}",
                f"{int(alpha.min())}..{int(alpha.max())}",
                f"{bounds[0]},{bounds[1]}-{bounds[2]},{bounds[3]}",
                "/".join(str(value) for value in margins),
                digest[:12],
            )
        )

    duplicate_groups: dict[str, list[str]] = {}
    for kind, digest in hashes.items():
        duplicate_groups.setdefault(digest, []).append(kind)
    for kinds in duplicate_groups.values():
        if len(kinds) > 1:
            issues.append(f"duplicate files: {', '.join(kinds)}")

    print("| Type | Image | Alpha | Bounds | Margins L/T/R/B | SHA-256 |")
    print("|---|---|---|---|---|---|")
    for row in rows:
        print("| " + " | ".join(row) + " |")

    if issues:
        print("\nFAIL")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("\nPASS: six distinct, decodable, normalized RGBA PNGs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
