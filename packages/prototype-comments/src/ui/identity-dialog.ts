import type { Identity } from "../types.js";
import { isValidEmail } from "./identity.js";

/**
 * Shows a modal that captures name + email. Resolves with the identity once
 * the user submits valid input, or `null` if they cancel.
 *
 * The modal lives inside the widget's Shadow DOM so it can't be styled by the
 * host page. The backdrop is rendered via the shadow host, which is already
 * fixed-positioned over the viewport.
 */
export function promptIdentity(shadow: ShadowRoot): Promise<Identity | null> {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const backdrop = document.createElement("div");
    backdrop.className = "pc-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "pc-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "pc-modal-title");

    const title = document.createElement("div");
    title.className = "pc-modal-title";
    title.id = "pc-modal-title";
    title.textContent = "Who's leaving this comment?";

    const subtitle = document.createElement("div");
    subtitle.className = "pc-modal-subtitle";
    subtitle.textContent = "We'll remember you on this device — no account needed.";

    const nameLabel = document.createElement("label");
    nameLabel.className = "pc-modal-label";
    nameLabel.textContent = "Name";
    const nameInput = document.createElement("input");
    nameInput.className = "pc-modal-input";
    nameInput.type = "text";
    nameInput.autocomplete = "name";
    nameInput.placeholder = "Jane Doe";
    nameLabel.appendChild(nameInput);

    const emailLabel = document.createElement("label");
    emailLabel.className = "pc-modal-label";
    emailLabel.textContent = "Email";
    const emailInput = document.createElement("input");
    emailInput.className = "pc-modal-input";
    emailInput.type = "email";
    emailInput.autocomplete = "email";
    emailInput.placeholder = "jane@example.com";
    emailLabel.appendChild(emailInput);

    const error = document.createElement("div");
    error.className = "pc-modal-error";
    error.style.display = "none";

    const actions = document.createElement("div");
    actions.className = "pc-modal-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "pc-btn";
    cancelBtn.textContent = "Cancel";

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "pc-btn is-primary";
    submitBtn.textContent = "Continue";

    actions.append(cancelBtn, submitBtn);
    modal.append(title, subtitle, nameLabel, emailLabel, error, actions);
    backdrop.appendChild(modal);
    shadow.appendChild(backdrop);

    let settled = false;
    const close = (result: Identity | null) => {
      if (settled) return;
      settled = true;
      backdrop.removeEventListener("keydown", onKeydown);
      backdrop.remove();
      previouslyFocused?.focus?.();
      resolve(result);
    };

    const setError = (message: string | null) => {
      if (!message) {
        error.style.display = "none";
        error.textContent = "";
        return;
      }
      error.style.display = "";
      error.textContent = message;
    };

    const submit = () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      if (!name) {
        setError("Please enter your name.");
        nameInput.focus();
        return;
      }
      if (!isValidEmail(email)) {
        setError("Please enter a valid email.");
        emailInput.focus();
        return;
      }
      close({ name, email });
    };

    submitBtn.addEventListener("click", submit);
    cancelBtn.addEventListener("click", () => close(null));

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(null);
      } else if (e.key === "Enter" && (e.target === nameInput || e.target === emailInput)) {
        e.preventDefault();
        submit();
      } else if (e.key === "Tab") {
        const focusables = [nameInput, emailInput, cancelBtn, submitBtn];
        const active = shadow.activeElement as HTMLElement | null;
        const i = active ? focusables.indexOf(active as HTMLInputElement) : -1;
        if (i === -1) return;
        const next = e.shiftKey
          ? focusables[(i - 1 + focusables.length) % focusables.length]
          : focusables[(i + 1) % focusables.length];
        e.preventDefault();
        next.focus();
      }
    };
    backdrop.addEventListener("keydown", onKeydown);

    requestAnimationFrame(() => nameInput.focus());
  });
}
