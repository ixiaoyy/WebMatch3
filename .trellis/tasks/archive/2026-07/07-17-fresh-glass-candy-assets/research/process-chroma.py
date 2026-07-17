"""Remove a simple green/magenta key and normalize one candy to a square PNG."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--key", choices=("green", "magenta"), required=True)
    parser.add_argument("--canvas", type=int, default=512)
    parser.add_argument("--subject", type=int, default=420)
    return parser.parse_args()


def smoothstep(values: np.ndarray) -> np.ndarray:
    values = np.clip(values, 0.0, 1.0)
    return values * values * (3.0 - 2.0 * values)


def main() -> None:
    args = parse_args()
    rgb = np.asarray(Image.open(args.source).convert("RGB"), dtype=np.float32)

    border = np.concatenate(
        (
            rgb[:16].reshape(-1, 3),
            rgb[-16:].reshape(-1, 3),
            rgb[:, :16].reshape(-1, 3),
            rgb[:, -16:].reshape(-1, 3),
        )
    )
    background = np.median(border, axis=0)

    if args.key == "green":
        signal = np.maximum(rgb[..., 0], rgb[..., 2])
        border_signal = np.maximum(border[..., 0], border[..., 2])
    else:
        signal = rgb[..., 1]
        border_signal = border[..., 1]

    low = min(48.0, float(np.percentile(border_signal, 99.5)) + 4.0)
    alpha = smoothstep((signal - low) / (230.0 - low))

    safe_alpha = np.maximum(alpha[..., None], 1.0 / 255.0)
    foreground = (rgb - (1.0 - alpha[..., None]) * background) / safe_alpha
    foreground = np.clip(foreground, 0.0, 255.0)
    foreground[alpha <= 1.0 / 255.0] = 0.0

    rgba = np.dstack((foreground.astype(np.uint8), np.round(alpha * 255).astype(np.uint8)))
    visible = rgba[..., 3] >= 8
    ys, xs = np.where(visible)
    if not len(xs):
        raise RuntimeError("No non-transparent subject pixels found")

    crop = Image.fromarray(rgba, mode="RGBA").crop(
        (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    )
    scale = min(args.subject / crop.width, args.subject / crop.height)
    size = (
        max(1, round(crop.width * scale)),
        max(1, round(crop.height * scale)),
    )
    crop = crop.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (args.canvas, args.canvas), (0, 0, 0, 0))
    offset = ((args.canvas - crop.width) // 2, (args.canvas - crop.height) // 2)
    canvas.alpha_composite(crop, offset)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, optimize=True)

    output_alpha = np.asarray(canvas.getchannel("A"))
    output_rgb = np.asarray(canvas.convert("RGB"))
    out_ys, out_xs = np.where(output_alpha >= 8)
    edge = (output_alpha > 0) & (output_alpha < 255)
    if args.key == "green":
        key_fringe = edge & (
            output_rgb[..., 1]
            > np.maximum(output_rgb[..., 0], output_rgb[..., 2]) + 16
        )
    else:
        key_fringe = edge & (
            np.minimum(output_rgb[..., 0], output_rgb[..., 2])
            > output_rgb[..., 1] + 16
        )
    print(f"background={tuple(int(value) for value in background)}")
    print(f"key_signal_low={low:.2f}")
    print(f"size={canvas.width}x{canvas.height}")
    print(
        "bounds="
        f"{int(out_xs.min())},{int(out_ys.min())},"
        f"{int(out_xs.max()) + 1},{int(out_ys.max()) + 1}"
    )
    print(f"alpha_range={int(output_alpha.min())}..{int(output_alpha.max())}")
    print(f"transparent_pixels={int(np.count_nonzero(output_alpha == 0))}")
    print(f"opaque_pixels={int(np.count_nonzero(output_alpha == 255))}")
    print(f"key_fringe_pixels={int(np.count_nonzero(key_fringe))}")


if __name__ == "__main__":
    main()
