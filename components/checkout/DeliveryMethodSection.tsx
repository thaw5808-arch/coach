import { DELIVERY_PRICE, DELIVERY_TITLE, getDeliveryDetail, isExpressAvailable, type DeliveryMethod } from "@/lib/checkout/delivery";
import { formatPrice } from "@/lib/format";
import { CITY_CENTRE, distanceLabel, haversineMiles, stores } from "@/lib/stores";
import { DeliveryOption } from "./DeliveryOption";

const METHODS: DeliveryMethod[] = ["standard", "express", "store"];

export function DeliveryMethodSection({
  method,
  address,
  storeId,
  showStoreError,
  onMethodChange,
  onStoreChange,
}: {
  method: DeliveryMethod;
  /** Country + postal code of the delivery address — transit times and copy depend on them. */
  address: { country: string; zip: string };
  storeId: string | null;
  showStoreError?: boolean;
  onMethodChange: (method: DeliveryMethod) => void;
  onStoreChange: (id: string) => void;
}) {
  const expressAvailable = isExpressAvailable();

  return (
    <div id="delivery-method" tabIndex={-1} className="flex w-full flex-col items-start gap-5 focus:outline-none">
      <div className="flex items-baseline gap-3">
        <p className="type-eyebrow text-accent-deep">03</p>
        <p className="type-h3 text-ink">Delivery Method</p>
      </div>

      <div className="flex w-full flex-col items-start gap-3">
        {METHODS.map((m) => {
          const disabled = m === "express" && !expressAvailable;
          return (
            <DeliveryOption
              key={m}
              name="delivery-method"
              title={DELIVERY_TITLE[m]}
              detail={getDeliveryDetail(m, address)}
              price={DELIVERY_PRICE[m] === 0 ? "Complimentary" : formatPrice(DELIVERY_PRICE[m])}
              selected={method === m}
              disabled={disabled}
              onSelect={() => onMethodChange(m)}
            />
          );
        })}
      </div>

      {method === "store" && (
        <div className="flex w-full flex-col items-start gap-3">
          {stores.map((store) => {
            const selected = store.id === storeId;
            return (
              <label
                key={store.id}
                className={`flex w-full cursor-pointer items-start gap-4 rounded-[20px] py-4 pl-5 pr-6 ${selected ? "bg-blob" : "bg-surface hover:bg-blob/60"}`}
              >
                <input type="radio" name="store" className="sr-only" checked={selected} onChange={() => onStoreChange(store.id)} />
                <span aria-hidden="true" className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-ink" : "border-ink-muted"}`}>
                  {selected && <span className="size-2.5 rounded-full bg-ink" />}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="type-h4 text-ink">{store.name}</span>
                  <span className="type-caption text-ink-muted">
                    {store.address} · {distanceLabel(haversineMiles(CITY_CENTRE, store))}
                  </span>
                </span>
                <span className={`type-caption shrink-0 ${selected ? "text-accent-deep" : "text-ink"}`}>{store.readiness}</span>
              </label>
            );
          })}
          {showStoreError && !storeId && (
            <p role="alert" className="type-caption text-error">
              Please choose a boutique.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
