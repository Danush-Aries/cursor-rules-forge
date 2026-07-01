"use client";

const EXAMPLES = [
  { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
  { label: "pallets/flask", url: "https://github.com/pallets/flask" },
];

export function TryExamples() {
  return (
    <div className="mt-6 text-xs text-muted-foreground">
      Try{" "}
      {EXAMPLES.map((ex, i) => (
        <span key={ex.url}>
          <button
            type="button"
            onClick={() => {
              const input =
                document.querySelector<HTMLInputElement>("input[type=text]");
              if (input) {
                const setter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  "value"
                )?.set;
                setter?.call(input, ex.url);
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.focus();
              }
            }}
            className="underline hover:text-foreground"
          >
            {ex.label}
          </button>
          {i < EXAMPLES.length - 1 ? " or " : ""}
        </span>
      ))}
    </div>
  );
}
