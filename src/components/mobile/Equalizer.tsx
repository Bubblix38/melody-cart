interface EqualizerProps {
  active?: boolean;
  barCount?: number;
}

export default function Equalizer({ active = false, barCount = 4 }: EqualizerProps) {
  const delays = [0, 0.2, 0.4, 0.1, 0.3];
  return (
    <div className={`equalizer ${active ? "playing" : ""}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className="eq-bar"
          style={{ animationDelay: `${delays[i % delays.length]}s` }}
        />
      ))}
    </div>
  );
}
