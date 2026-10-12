import { useState } from "react";

// Put the official logo at public/brand/esds-logo.png (or change the file name below).
const LOGO_SRC = `${import.meta.env.BASE_URL}brand/esds-logo.png`;

export default function BrandLogo() {
  const [missing, setMissing] = useState(false);
  return (
    <div className="sb-logo">
      {missing
        ? <span className="logo-fallback" title="Add public/brand/esds-logo.png">ESDS</span>
        : <img src={LOGO_SRC} alt="ESDS" onError={() => setMissing(true)} />}
    </div>
  );
}
