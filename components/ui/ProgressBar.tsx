'use client'

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  label?: string
  showValue?: boolean
  unit?: string
  height?: string
}

export default function ProgressBar({
  value,
  max,
  color = '#e85d3a',
  label,
  showValue = true,
  unit = '',
  height = 'h-2',
}: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-muted">{label}</span>}
          {showValue && (
            <span className="text-xs font-num text-white ml-auto">
              {value}
              {unit} / {max}
              {unit}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-border rounded-full ${height} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
