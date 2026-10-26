import React, { useEffect, useState } from 'react';

export type InputStatus = 'default' | 'valid' | 'warning' | 'error';

export interface InputFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  unit?: string;
  icon?: string;
  targetHint?: string;
  helperText?: string;
  hint?: string;
  error?: string;
  status?: InputStatus;
  inputSize?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
  /** Si es true, muestra el 0 numérico en lugar de dejar el campo vacío con placeholder */
  showZero?: boolean;
}

const STATUS_BORDER: Record<InputStatus, string> = {
  default:
    'border-2 border-[#d4ccb8] bg-white text-[#191c1e] focus:border-[#004ac6] focus:ring-4 focus:ring-[#004ac6]/15',
  valid:
    'border-2 border-emerald-500 bg-emerald-50/70 text-emerald-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20',
  warning:
    'border-2 border-amber-500 bg-amber-100/80 text-amber-950 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/25',
  error:
    'border-2 border-red-500 bg-red-100/85 text-red-950 focus:border-red-600 focus:ring-4 focus:ring-red-500/25',
};

const STATUS_TEXT: Record<InputStatus, string> = {
  default: 'text-[#5f6374]',
  valid: 'text-emerald-800 font-bold',
  warning: 'text-amber-900 font-bold',
  error: 'text-red-800 font-bold',
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  unit,
  icon,
  targetHint,
  helperText,
  hint,
  error,
  status = 'default',
  inputSize = 'md',
  disabled,
  readOnly,
  type,
  inputMode,
  value,
  onChange,
  onFocus,
  onBlur,
  showZero = false,
  containerClassName = '',
  className = '',
  ...rest
}) => {
  const isNumberInput = type === 'number';
  const [isFocused, setIsFocused] = useState(false);

  const computeExternalString = (
    val: string | number | readonly string[] | undefined
  ): string => {
    if (val === undefined || val === null || val === '') return '';
    if (
      isNumberInput &&
      !showZero &&
      (val === 0 || val === '0' || Number.isNaN(val))
    ) {
      return '';
    }
    return String(val);
  };

  const [rawValue, setRawValue] = useState<string>(() =>
    computeExternalString(value)
  );

  useEffect(() => {
    if (!isFocused) {
      setRawValue(computeExternalString(value));
    } else if (value !== undefined) {
      const numericRaw = rawValue === '' ? 0 : Number(rawValue);
      const numericProp =
        typeof value === 'number' ? value : Number(value || 0);
      if (
        !Number.isNaN(numericProp) &&
        numericRaw !== numericProp &&
        rawValue !== ''
      ) {
        setRawValue(computeExternalString(value));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isFocused, showZero]);

  const sizePadding =
    inputSize === 'sm'
      ? 'min-h-[48px] py-2.5 text-sm font-bold'
      : inputSize === 'lg'
      ? 'min-h-[54px] py-3.5 text-lg font-mono font-black'
      : 'min-h-[48px] py-2.5 text-base font-bold';

  const resolvedStatus: InputStatus = error ? 'error' : status;
  const resolvedHelperText = error || helperText || hint;
  const resolvedInputMode =
    inputMode || (isNumberInput ? 'decimal' : undefined);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setRawValue(computeExternalString(value));
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setRawValue(computeExternalString(value));
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(e.target.value);
    onChange?.(e);
  };

  const displayedValue =
    value !== undefined
      ? isFocused
        ? rawValue
        : computeExternalString(value)
      : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {(label || targetHint) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#434655] flex items-center gap-1.5">
              {icon && (
                <span className="material-symbols-outlined text-[16px] text-[#004ac6]">
                  {icon}
                </span>
              )}
              <span>{label}</span>
            </label>
          )}
          {targetHint && (
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#f4efe6] text-[#434655] border border-[#e6decb]">
              {targetHint}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          type={type}
          step={rest.step ?? (type === 'time' ? '1' : undefined)}
          inputMode={resolvedInputMode}
          disabled={disabled}
          readOnly={readOnly}
          value={displayedValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full rounded-xl px-3.5 ${
            unit ? 'pr-14' : ''
          } placeholder:text-[#9ca3af] placeholder:font-normal outline-none transition-all ${sizePadding} ${
            disabled || readOnly
              ? 'bg-[#f4efe6] border-2 border-[#e6decb] text-[#5f6374] cursor-not-allowed select-none'
              : STATUS_BORDER[resolvedStatus]
          } ${className}`}
          {...rest}
        />
        {unit && (
          <span
            className={`absolute right-3.5 text-xs font-mono font-extrabold pointer-events-none select-none ${
              resolvedStatus === 'error'
                ? 'text-red-800'
                : resolvedStatus === 'warning'
                ? 'text-amber-900'
                : resolvedStatus === 'valid'
                ? 'text-emerald-800'
                : 'text-[#5f6374]'
            }`}
          >
            {unit}
          </span>
        )}
      </div>

      {resolvedHelperText && (
        <p className={`text-xs leading-snug ${STATUS_TEXT[resolvedStatus]}`}>
          {resolvedHelperText}
        </p>
      )}
    </div>
  );
};
