"use client";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Sil",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm font-medium text-red-400 hover:text-red-300"
      >
        {label}
      </button>
    </form>
  );
}
