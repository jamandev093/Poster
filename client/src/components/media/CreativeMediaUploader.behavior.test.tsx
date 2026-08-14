// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import CreativeMediaUploader from "./CreativeMediaUploader";

import type {
  CreativeMediaSelection,
} from "./CreativeMediaUploader";

let revokedUrls: string[] = [];

class FakeImage {
  naturalWidth = 1280;
  naturalHeight = 720;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(value: string) {
    void value;
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');

  if (!(input instanceof HTMLInputElement)) {
    throw new Error("Expected media file input.");
  }

  return input;
}

function props(
  onChange: (
    value: CreativeMediaSelection | null
  ) => void
) {
  return {
    label: "Primary creative",
    description: "Upload creative media.",
    role: "primary" as const,
    frameProfile: "standard_media" as const,
    accept:
      "image/png,image/jpeg,image/webp,video/mp4,video/webm",
    allowVideo: true,
    altTextRequired: true,
    onChange,
  };
}

beforeEach(() => {
  revokedUrls = [];

  vi.stubGlobal("Image", FakeImage);

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: () => "blob:poster-media",
  });

  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: (value: string) => {
      revokedUrls.push(value);
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CreativeMediaUploader behavior", () => {
  it("shows and removes an existing creative", () => {
    const values: Array<CreativeMediaSelection | null> = [];

    render(
      <CreativeMediaUploader
        {...props(value => values.push(value))}
        initialFileName="existing.jpg"
      />
    );

    expect(screen.getByText("Existing creative")).toBeTruthy();
    expect(screen.getByText("existing.jpg")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove",
      })
    );

    expect(values).toEqual([null]);
  });

  it("rejects unsupported media and video in image-only slots", () => {
    const values: Array<CreativeMediaSelection | null> = [];

    const first = render(
      <CreativeMediaUploader
        {...props(value => values.push(value))}
      />
    );

    fireEvent.change(fileInput(first.container), {
      target: {
        files: [
          new File(["pdf"], "creative.pdf", {
            type: "application/pdf",
          }),
        ],
      },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Choose a supported image or video file."
    );

    first.unmount();

    const second = render(
      <CreativeMediaUploader
        {...props(value => values.push(value))}
        allowVideo={false}
      />
    );

    fireEvent.change(fileInput(second.container), {
      target: {
        files: [
          new File(["video"], "creative.mp4", {
            type: "video/mp4",
          }),
        ],
      },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Video is not supported for this creative slot."
    );
  });

  it("rejects an oversized image before metadata processing", () => {
    const values: Array<CreativeMediaSelection | null> = [];

    const view = render(
      <CreativeMediaUploader
        {...props(value => values.push(value))}
        maxImageBytes={1}
      />
    );

    fireEvent.change(fileInput(view.container), {
      target: {
        files: [
          new File(["xx"], "large.jpg", {
            type: "image/jpeg",
          }),
        ],
      },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Image must be"
    );
    expect(values).toHaveLength(0);
  });

  it("reads image metadata propagates alt text and revokes preview URL", async () => {
    const values: Array<CreativeMediaSelection | null> = [];

    const view = render(
      <CreativeMediaUploader
        {...props(value => values.push(value))}
      />
    );

    fireEvent.change(fileInput(view.container), {
      target: {
        files: [
          new File(["image"], "creative.jpg", {
            type: "image/jpeg",
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(values).toHaveLength(1);
    });

    const selected = values[0];

    if (!selected) {
      throw new Error("Expected selected media.");
    }

    expect(selected.previewUrl).toBe("blob:poster-media");
    expect(selected.asset.type).toBe("image");
    expect(selected.asset.fileName).toBe("creative.jpg");
    expect(selected.asset.width).toBe(1280);
    expect(selected.asset.height).toBe(720);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe this creative for accessibility"
      ),
      {
        target: {
          value: "Accessible description",
        },
      }
    );

    const updated = values[values.length - 1];

    if (!updated) {
      throw new Error("Expected updated media.");
    }

    expect(updated.asset.altText).toBe(
      "Accessible description"
    );

    view.unmount();

    expect(revokedUrls).toContain("blob:poster-media");
  });
});