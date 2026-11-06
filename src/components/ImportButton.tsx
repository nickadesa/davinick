import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseSimpleCsv, type ImportRow } from "@/lib/journal-import";
import { toast } from "sonner";

export function ImportButton({ onImport }: { onImport: (rows: ImportRow[]) => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseSimpleCsv(text);
      setPreview(rows);
      if (rows.length === 0) toast.error("No trades found in file");
    };
    reader.readAsText(file);
  }

  function confirm() {
    if (preview.length) {
      onImport(preview);
      toast.success(`Imported ${preview.length} trades`);
      setOpen(false);
      setPreview([]);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Import CSV</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import trades</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
            {preview.length > 0 && (
              <div className="max-h-60 overflow-auto rounded border p-2 text-xs">
                <p className="mb-2 font-medium">{preview.length} trades found</p>
                {preview.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex justify-between border-b py-1">
                    <span>{r.date} {r.instrument}</span>
                    <span>{r.pnl}</span>
                  </div>
                ))}
                {preview.length > 5 && <p className="pt-1 text-muted-foreground">...and {preview.length - 5} more</p>}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={confirm} disabled={!preview.length}>Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
