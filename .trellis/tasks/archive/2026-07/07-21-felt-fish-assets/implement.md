# Replace jelly assets with felt fish — implementation plan

## Ordered micro-tasks

- [x] Produce `fish-whale.png` and save its prompt.
- [x] Produce `fish-koi.png` and save its prompt.
- [x] Produce `fish-sardine.png` and save its prompt.
- [x] Produce `fish-puffer.png` and save its prompt.
- [x] Produce `fish-goldfish.png` and save its prompt.
- [x] Produce `fish-clownfish.png` and save its prompt.
- [x] Produce `fish-angelfish.png` and save its prompt.
- [x] Produce `fish-betta.png` and save its prompt.
- [x] Expand the shared kind registry and level kind-count configuration.
- [x] Increase the piece-count progression and authored geometry for one dense
      overlapping fish pile.
- [x] Replace presentation assets and accessible labels with the eight fish.
- [x] Keep snapshot version 2 and accept both existing and new kinds.
- [ ] Perform one final manual verification against the PRD.

## Current execution slice

The next slice replaces presentation assets and accessible labels with the
eight accepted fish. Keep canonical Fish-domain renaming in the follow-on
`07-21-rename-jelly-domain-to-fish` task.

## Rollback

Registry rollback must remove only the four appended kind keys, restore the
four-kind level schedule, remove the temporary UI fallback, and revert its
focused tests/spec updates. Do not alter any completed fish asset or cat work.
