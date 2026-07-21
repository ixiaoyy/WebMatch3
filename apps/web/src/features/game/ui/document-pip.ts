interface DocumentPictureInPictureWindow extends Window {
  readonly document: Document;
}
interface DocumentPictureInPictureApi {
  requestWindow(options?: { width?: number; height?: number }): Promise<DocumentPictureInPictureWindow>;
}

type WindowWithDocumentPip = Window & {
  documentPictureInPicture?: DocumentPictureInPictureApi;
};

export interface DocumentPipController {
  readonly supported: boolean;
  readonly opened: boolean;
  open(surface: HTMLElement, anchor: HTMLElement): Promise<boolean>;
  close(): void;
}

export function createDocumentPipController(
  onSurfaceChange: (surfaceWindow: Window | null) => void,
): DocumentPipController {
  const api = (window as WindowWithDocumentPip).documentPictureInPicture;
  let pipWindow: DocumentPictureInPictureWindow | null = null;
  let surface: HTMLElement | null = null;
  let anchor: HTMLElement | null = null;

  function copyStyles(target: Document): void {
    for (const node of document.querySelectorAll("style, link[rel='stylesheet']")) {
      target.head.append(node.cloneNode(true));
    }
  }

  function restore(): void {
    if (surface && anchor) anchor.append(surface);
    pipWindow = null;
    surface = null;
    anchor = null;
    onSurfaceChange(null);
  }

  async function open(nextSurface: HTMLElement, nextAnchor: HTMLElement): Promise<boolean> {
    if (!api || pipWindow) return false;
    try {
      const nextWindow = await api.requestWindow({ width: 430, height: 560 });
      copyStyles(nextWindow.document);
      nextWindow.document.documentElement.lang = document.documentElement.lang;
      nextWindow.document.body.className = "document-pip-body";
      nextWindow.document.body.append(nextSurface);
      pipWindow = nextWindow;
      surface = nextSurface;
      anchor = nextAnchor;
      nextWindow.addEventListener("pagehide", restore, { once: true });
      onSurfaceChange(nextWindow);
      return true;
    } catch {
      return false;
    }
  }

  function close(): void {
    pipWindow?.close();
  }

  return {
    supported: Boolean(api),
    get opened() {
      return pipWindow !== null;
    },
    open,
    close,
  };
}
