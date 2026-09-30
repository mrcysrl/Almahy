type Props = {
  id: string;
  label: string;
  srSuffix?: string; // extra label text for screen readers, e.g. " (item 2)"
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email";
  multiline?: boolean;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  autoComplete?: string;
};

export function TextField({
  id,
  label,
  srSuffix,
  value,
  onChange,
  error,
  type = "text",
  multiline = false,
  placeholder,
  inputMode,
  autoComplete,
}: Props) {
  const errorId = `${id}-error`;
  const className = `mt-1 w-full rounded border px-3 py-2 text-sm ${
    error ? "border-red-500" : "border-gray-300"
  }`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {srSuffix && <span className="sr-only">{srSuffix}</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}