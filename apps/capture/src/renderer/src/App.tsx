import { useState } from "react";
import { CaptureView } from "./CaptureView";
import { useCapture } from "./capture/useCapture";
import type { DeviceStatus } from "./capture/types";
import { DatasetView } from "./dataset/DatasetView";

const STATUS_LABEL: Record<DeviceStatus, string> = {
  CONNECTED: "CONNECTED",
  CONNECTING: "CONNECTING",
  DISCONNECTED: "DISCONNECTED",
  ERROR: "ERROR",
};

function StatusDot({ status }: { status: DeviceStatus }) {
  return <span className={`status-dot status-dot--${status.toLowerCase()}`} />;
}

type Tab = "capture" | "dataset";

export default function App() {
  const capture = useCapture();
  const [tab, setTab] = useState<Tab>("capture");

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          Hoop<span className="accent">Sync</span> Capture
        </h1>
        <div className="device-status">
          <StatusDot status={capture.status} />
          <span>{STATUS_LABEL[capture.status]}</span>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "capture" ? "tabs__tab tabs__tab--active" : "tabs__tab"} onClick={() => setTab("capture")}>
          Capture
        </button>
        <button className={tab === "dataset" ? "tabs__tab tabs__tab--active" : "tabs__tab"} onClick={() => setTab("dataset")}>
          Dataset
        </button>
      </nav>

      {/* Both views stay mounted at all times, toggled via `hidden` rather than
          conditional rendering - the live <video> element lives inside CaptureView, and
          unmounting it would drop the stream binding and stop the capture loops (they're
          tied to that specific DOM node), breaking both the preview and DatasetView's
          "capture from live feed" until a manual reconnect. */}
      <div hidden={tab !== "capture"}>
        <CaptureView capture={capture} />
      </div>
      <div hidden={tab !== "dataset"}>
        <DatasetView videoRef={capture.videoRef} captureStatus={capture.status} />
      </div>
    </div>
  );
}
