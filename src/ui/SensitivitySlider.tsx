const MIN = 0.2
const MAX = 2.5
const STEP = 0.1

export function SensitivitySlider({
  value,
  onChange,
  id = 'look-sensitivity',
}: {
  value: number
  onChange: (value: number) => void
  id?: string
}) {
  const safeValue = Number.isFinite(value) ? value : 1
  const label = `${safeValue.toFixed(1)}×`

  return (
    <div className="sensitivity-control">
      <div className="sensitivity-header">
        <label htmlFor={id}>Look sensitivity</label>
        <span className="sensitivity-value" aria-live="polite">
          {label}
        </span>
      </div>
      <input
        id={id}
        className="sensitivity-slider"
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={safeValue}
        aria-valuetext={`${label} default look speed`}
      />
      <div className="sensitivity-ends" aria-hidden="true">
        <span>Slower</span>
        <span>Faster</span>
      </div>
    </div>
  )
}
