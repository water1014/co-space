type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function BoundaryToggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="font-serif text-[15px] text-paper/85">{label}</p>
        {description && (
          <p className="mt-1.5 text-[12.5px] leading-[1.95] text-muted/75">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-[18px] w-[34px] shrink-0 rounded-full transition-colors duration-500 disabled:opacity-40 ${
          checked ? "bg-[rgb(var(--ambient)/0.85)]" : "bg-white/15"
        }`}
      >
        <span
          className="absolute top-[3px] h-3 w-3 rounded-full bg-[#0a0b0f] shadow-sm transition-all duration-500"
          style={{ left: checked ? 18 : 3 }}
        />
      </button>
    </div>
  );
}
