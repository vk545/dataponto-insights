
import { useState } from "react";
import { Phone, X } from "lucide-react";

const phones = [
  { label: "Dataponto", number: "3658-1109", href: "tel:36581109" },
  { label: "Rep Relógios", number: "5538-1400", href: "tel:55381400" },
];

export function FloatingPhone() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-[72px] right-4 z-[60] flex flex-col items-end gap-3">
      {/* Phone options */}
      {open && (
        <div className="flex flex-col gap-2 items-end">
          {phones.map((phone) => (
            <a
              key={phone.label}
              href={phone.href}
              className="flex items-center gap-3 bg-card border border-border shadow-lg rounded-full px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all duration-200 animate-in slide-in-from-bottom-2"
            >
              <div className="flex flex-col items-end leading-tight">
                <span className="text-xs text-muted-foreground">{phone.label}</span>
                <span className="font-semibold">{phone.number}</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 active:scale-95"
        aria-label="Ligar para recepção"
      >
        {open ? <X className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
      </button>
    </div>
  );
}
