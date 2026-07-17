import WaeyFlowField from "./WaeyFlowField.jsx";

export default function AmbientBackdrop({ tone = "light" }) {
  return (
    <div data-waey-backdrop className="waey-page-backdrop" aria-hidden="true">
      <WaeyFlowField tone={tone} />
    </div>
  );
}
