import { Checkbox } from "@/components/ui/Checkbox";

const NOTE_LIMIT = 200;

/** Figma "Gift Option" + "State / Gift — Selected" (Shopping Bag 43:122 / States 45:326). */
export function GiftOption({
  wrapped,
  note,
  onWrappedChange,
  onNoteChange,
}: {
  wrapped: boolean;
  note: string;
  onWrappedChange: (wrapped: boolean) => void;
  onNoteChange: (note: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-pill bg-surface py-3 pl-3 pr-6">
      <div className="flex items-center gap-2">
        <Checkbox checked={wrapped} onChange={onWrappedChange} label="Make It a Gift" />
        <div className="flex flex-col gap-0.5">
          <p className="type-h4 text-ink">Make It a Gift</p>
          <p className="type-caption text-ink-muted">Complimentary gift packaging and a handwritten note</p>
        </div>
      </div>

      {wrapped && (
        <>
          <div className="pl-11">
            <div className="flex flex-col gap-2 rounded-pill border-[1.5px] border-accent-deep bg-bg px-5 pb-3 pt-4">
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value.slice(0, NOTE_LIMIT))}
                maxLength={NOTE_LIMIT}
                rows={2}
                placeholder="Add a note for the recipient…"
                className="type-body min-h-[48px] w-full resize-none bg-transparent text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <p className="type-caption w-full text-right text-ink-muted">
                {note.length} / {NOTE_LIMIT}
              </p>
            </div>
          </div>
          <p className="type-caption pl-11 text-ink-muted">Prices are never shown on gift orders.</p>
        </>
      )}
    </div>
  );
}
