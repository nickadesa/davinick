import { SettingsModal } from "@/boardui/components/application/settings/settings-modal";
import { Switch } from "@/boardui/components/base/switch/switch";
import { SegmentedControl, SegmentedControlItem } from "@/boardui/components/base/segmented-control/segmented-control";
import { usePreferences } from "@/lib/preferences";
import { useTheme } from "@/hooks/use-theme";
export function WorkspaceSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { preferences: p, update } = usePreferences();
  const { dark, toggle } = useTheme();
  return <SettingsModal isOpen={open} onClose={onClose} content={<div className="space-y-8">
    <section className="space-y-4"><h3 className="text-lg font-medium">Appearance</h3>
      <Switch isSelected={dark} onChange={toggle}>Dark mode</Switch>
      <Switch isSelected={p.glass} onChange={(glass) => update({ glass })}>Liquid glass</Switch>
      <SegmentedControl aria-label="Glass preset" selectedKeys={[p.glassPreset]} onSelectionChange={(keys) => { const v = [...keys][0]; if (v === "Subtle" || v === "Balanced" || v === "Clear") update({ glassPreset: v }); }}>
        {["Subtle", "Balanced", "Clear"].map((v) => <SegmentedControlItem key={v} id={v}>{v}</SegmentedControlItem>)}
      </SegmentedControl>
    </section>
    <section className="space-y-4"><h3 className="text-lg font-medium">Display</h3>
      <SegmentedControl aria-label="Spacing" selectedKeys={[p.density]} onSelectionChange={(keys) => { const v = [...keys][0]; if (v === "compact" || v === "comfortable") update({ density: v }); }}><SegmentedControlItem id="comfortable">Comfortable</SegmentedControlItem><SegmentedControlItem id="compact">Compact</SegmentedControlItem></SegmentedControl>
      <Switch isSelected={p.textSize === "large"} onChange={(v) => update({ textSize: v ? "large" : "standard" })}>Larger text</Switch>
    </section>
    <section className="space-y-4"><h3 className="text-lg font-medium">Notifications</h3><Switch isSelected={p.newsAlerts} onChange={(newsAlerts) => update({ newsAlerts })}>Upcoming high-impact releases</Switch><Switch isSelected={p.aiAlerts} onChange={(aiAlerts) => update({ aiAlerts })}>New news analysis</Switch></section>
    <section className="space-y-3"><h3 className="text-lg font-medium">Time and Journal</h3><p className="text-sm text-muted-foreground">News times use New York (EST/EDT). Journal stays in this browser.</p><label className="block text-sm">Import timezone<select className="mt-2 block w-full rounded-lg border bg-card p-3" value={p.importZone} onChange={(e) => update({ importZone: e.target.value })}><option value="America/New_York">New York</option><option value="America/Chicago">Chicago</option><option value="UTC">UTC</option></select></label><p className="text-sm text-muted-foreground">Journal backup and restore are available in Journal. Claude connection requires your securely saved API key.</p></section>
  </div>} />;
}