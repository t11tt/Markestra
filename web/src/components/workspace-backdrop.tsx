export function WorkspaceBackdrop() {
  return (
    <div className="workspace-backdrop" aria-hidden="true">
      <div className="workspace-light workspace-light-a" />
      <div className="workspace-light workspace-light-b" />
      <svg viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMid slice" fill="none">
        <g className="workspace-contours">
          <path d="M-150 240C160-80 450 360 820 140S1340 20 1780 210" />
          <path d="M-150 290C180-20 450 410 850 200S1370 90 1780 270" />
          <path d="M-150 340C180 40 470 450 880 260S1390 140 1780 330" />
          <path d="M-80 800C230 530 570 1080 1000 790S1390 610 1760 840" />
          <path d="M-80 850C240 590 580 1130 1040 850S1420 680 1760 900" />
          <path d="M-80 900C240 650 610 1190 1080 910S1450 750 1760 960" />
        </g>
        <g className="workspace-crosslines">
          <path d="M1130-100C860 160 1510 330 1220 650S1090 1000 1400 1200" />
          <path d="M1180-100C920 160 1570 350 1280 680S1150 1030 1460 1200" />
        </g>
        <path className="workspace-tracer" d="M-150 290C180-20 450 410 850 200S1370 90 1780 270" />
      </svg>
      <span className="workspace-watermark">M.</span>
    </div>
  );
}
