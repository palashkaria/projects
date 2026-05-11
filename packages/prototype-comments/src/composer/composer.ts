import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";

export type ComposerResult = { body: string };

export type ComposerHandle = {
  close(): void;
};

export function openComposer(
  shadow: ShadowRoot,
  anchorElement: Element,
  options: {
    onSubmit(result: ComposerResult): void;
    onCancel(): void;
  },
): ComposerHandle {
  const composer = document.createElement("div");
  composer.className = "pc-composer";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Leave a comment…";
  textarea.rows = 3;

  const actions = document.createElement("div");
  actions.className = "pc-composer-actions";

  const hint = document.createElement("span");
  hint.className = "pc-composer-hint";
  hint.textContent = isMac() ? "⌘ + Enter" : "Ctrl + Enter";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "pc-btn";
  cancel.textContent = "Cancel";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "pc-btn is-primary";
  submit.textContent = "Send";
  submit.disabled = true;

  actions.append(hint, cancel, submit);
  composer.append(textarea, actions);
  shadow.appendChild(composer);

  const update = () => {
    computePosition(anchorElement, composer, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(12), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      composer.style.left = `${x}px`;
      composer.style.top = `${y}px`;
    });
  };

  const cleanupAutoUpdate = autoUpdate(anchorElement, composer, update);

  const fire = () => {
    const body = textarea.value.trim();
    if (!body) return;
    options.onSubmit({ body });
  };

  textarea.addEventListener("input", () => {
    submit.disabled = textarea.value.trim().length === 0;
  });
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      fire();
    } else if (e.key === "Escape") {
      e.preventDefault();
      options.onCancel();
    }
  });
  cancel.addEventListener("click", () => options.onCancel());
  submit.addEventListener("click", fire);

  // Defer focus so the click that opened us doesn't immediately blur it.
  requestAnimationFrame(() => textarea.focus());

  let closed = false;
  return {
    close() {
      if (closed) return;
      closed = true;
      cleanupAutoUpdate();
      composer.remove();
    },
  };
}

function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}
