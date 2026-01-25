export default function HeroTextOverlay() {
  return (
    <div className="absolute top-30 md:top-48 left-8 z-10">
      <h1
        className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-wider mb-3.5 opacity-100 font-sans"
        style={{
          color: "transparent",
          WebkitTextStroke: "4px var(--foreground)",
          paintOrder: "stroke fill",
        }}
      >
        BEAN
      </h1>
      <p className="text-foreground font-sans text-sm md:text-base max-w-xs tracking-widest lg:text-base">
        Your Friendly Helper for
        <br />
        Finding Lost Items
      </p>
    </div>
  )
}
