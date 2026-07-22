# Document Picture-in-Picture research

## Sources checked

- MDN, `DocumentPictureInPicture.requestWindow()`:
  https://developer.mozilla.org/en-US/docs/Web/API/DocumentPictureInPicture/requestWindow
- MDN, Document Picture-in-Picture API:
  https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API
- Chrome for Developers, "Picture-in-Picture for any Element":
  https://developer.chrome.com/docs/web-platform/document-picture-in-picture/

Checked on 2026-07-20.

## Confirmed constraints

- The API is limited-availability and must be treated as progressive
  enhancement rather than a baseline capability.
- It is available only in secure contexts in supporting browsers.
- `requestWindow()` requires transient user activation, so the small window
  can only be opened from an explicit player action.
- The returned object is a same-origin `Window` with its own document. Arbitrary
  HTML can be appended to that document.
- The picture-in-picture window never outlives its opener, cannot be navigated,
  and is limited to one per browser tab.
- Width and height are initial hints; the browser may clamp them and owns the
  final position.
- The small window's `pagehide` event is the supported hook for moving content
  back to the opener when the window closes.

## Design implications for this task

- Feature-detect `window.documentPictureInPicture`; do not render a disabled or
  unsupported control.
- Request the window directly inside the click/keyboard activation handler.
- Move one mounted playable DOM subtree between a placeholder in the main
  document and the picture-in-picture document. This preserves one Vue
  component instance and one canonical reactive state rather than trying to
  synchronize two games.
- Copy the relevant stylesheet text or stylesheet rules into the new document
  before moving the subtree; the picture-in-picture document does not
  automatically inherit the opener's presentation.
- On `pagehide`, move the subtree back to its original placeholder and restore
  focus to the main-page control when practical.
- The main document becoming hidden must not automatically pause gameplay while
  its playable subtree is visible in the picture-in-picture window. The
  attention policy should consider either surface active.
- If `requestWindow()` rejects because the capability was disabled or the user
  gesture is no longer valid, keep the main-page game in place and expose a
  short non-modal status; do not block play.
