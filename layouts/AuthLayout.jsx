import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";

export default function AuthLayout() {
  return (
    <div className="flex flex-col md:flex-row">
      <LeftPanel />
      <RightPanel />
    </div>
  );
}