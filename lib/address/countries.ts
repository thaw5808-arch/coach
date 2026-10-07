/**
 * Country-driven address data — the single source for region lists, labels, postal-code and phone rules.
 * Addresses store ISO codes (`country: "TH"`, `state: "10"`) and display full names via the helpers below.
 *
 * To add a country: append one `CountryConfig` to COUNTRY_LIST (and, optionally, a few mock autocomplete
 * entries in lib/checkout/addresses.ts and a tax rate in lib/checkout/tax.ts). Nothing else needs to change.
 */

export type Region = { code: string; name: string };
export type RegionGroup = { label: string; regions: Region[] };

export type CountryConfig = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** Regions are either absent, a flat list or option groups (UK nations). */
  region:
    | { kind: "none" }
    | { kind: "list"; label: string; required: boolean; regions: Region[] }
    | { kind: "groups"; label: string; required: boolean; groups: RegionGroup[] };
  postal: { label: string; pattern: RegExp; example: string; invalid: string; uppercase?: boolean };
  phone: {
    /** Country calling code, no "+". */
    dial: string;
    /** National trunk prefix used when dialling locally ("0" in most of Europe/Asia, "1" optional in NANP). */
    trunk: string;
    /** Length range of the national significant number (digits after the dial code / trunk). */
    nsn: [number, number];
    /** Shown as the field placeholder — international form, so the dial code is visible. */
    placeholder: string;
  };
};

const r = (pairs: [string, string][]): Region[] => pairs.map(([code, name]) => ({ code, name }));
const slugs = (names: string[]): Region[] => names.map((name) => ({ code: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name }));

const US_STATES = r([
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"],
  ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"],
  ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
]);

/** ISO 3166-2:TH — 76 provinces + Bangkok (special administrative area), sorted by name. */
const TH_PROVINCES = r([
  ["37", "Amnat Charoen"], ["15", "Ang Thong"], ["10", "Bangkok"], ["38", "Bueng Kan"], ["31", "Buri Ram"],
  ["24", "Chachoengsao"], ["18", "Chai Nat"], ["36", "Chaiyaphum"], ["22", "Chanthaburi"], ["50", "Chiang Mai"],
  ["57", "Chiang Rai"], ["20", "Chon Buri"], ["86", "Chumphon"], ["46", "Kalasin"], ["62", "Kamphaeng Phet"],
  ["71", "Kanchanaburi"], ["40", "Khon Kaen"], ["81", "Krabi"], ["52", "Lampang"], ["51", "Lamphun"], ["42", "Loei"],
  ["16", "Lop Buri"], ["58", "Mae Hong Son"], ["44", "Maha Sarakham"], ["49", "Mukdahan"], ["26", "Nakhon Nayok"],
  ["73", "Nakhon Pathom"], ["48", "Nakhon Phanom"], ["30", "Nakhon Ratchasima"], ["60", "Nakhon Sawan"],
  ["80", "Nakhon Si Thammarat"], ["55", "Nan"], ["96", "Narathiwat"], ["39", "Nong Bua Lam Phu"], ["43", "Nong Khai"],
  ["12", "Nonthaburi"], ["13", "Pathum Thani"], ["94", "Pattani"], ["82", "Phangnga"], ["93", "Phatthalung"],
  ["56", "Phayao"], ["67", "Phetchabun"], ["76", "Phetchaburi"], ["66", "Phichit"], ["65", "Phitsanulok"],
  ["14", "Phra Nakhon Si Ayutthaya"], ["54", "Phrae"], ["83", "Phuket"], ["25", "Prachin Buri"],
  ["77", "Prachuap Khiri Khan"], ["85", "Ranong"], ["70", "Ratchaburi"], ["21", "Rayong"], ["45", "Roi Et"],
  ["27", "Sa Kaeo"], ["47", "Sakon Nakhon"], ["11", "Samut Prakan"], ["74", "Samut Sakhon"], ["75", "Samut Songkhram"],
  ["19", "Saraburi"], ["91", "Satun"], ["33", "Si Sa Ket"], ["17", "Sing Buri"], ["90", "Songkhla"], ["64", "Sukhothai"],
  ["72", "Suphan Buri"], ["84", "Surat Thani"], ["32", "Surin"], ["63", "Tak"], ["92", "Trang"], ["23", "Trat"],
  ["34", "Ubon Ratchathani"], ["41", "Udon Thani"], ["61", "Uthai Thani"], ["53", "Uttaradit"], ["95", "Yala"],
  ["35", "Yasothon"],
]);

const CA_PROVINCES = r([
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"], ["NT", "Northwest Territories"], ["NS", "Nova Scotia"], ["NU", "Nunavut"],
  ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"], ["SK", "Saskatchewan"], ["YT", "Yukon"],
]);

const AU_STATES = r([
  ["ACT", "Australian Capital Territory"], ["NSW", "New South Wales"], ["NT", "Northern Territory"], ["QLD", "Queensland"],
  ["SA", "South Australia"], ["TAS", "Tasmania"], ["VIC", "Victoria"], ["WA", "Western Australia"],
]);

/** ISO 3166-2:JP — 47 prefectures in the conventional north → south order. */
const JP_PREFECTURES = r(
  [
    "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima", "Ibaraki", "Tochigi", "Gunma", "Saitama",
    "Chiba", "Tokyo", "Kanagawa", "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu", "Shizuoka",
    "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara", "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima",
    "Yamaguchi", "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki",
    "Kagoshima", "Okinawa",
  ].map((name, i) => [String(i + 1).padStart(2, "0"), name]),
);

/** Royal Mail doesn't need a county, so it's optional — ceremonial counties (England), preserved counties (Wales),
 * council areas (Scotland) and the six counties (Northern Ireland). */
const UK_COUNTIES: RegionGroup[] = [
  {
    label: "England",
    regions: slugs([
      "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire", "Cheshire", "City of London", "Cornwall",
      "Cumbria", "Derbyshire", "Devon", "Dorset", "Durham", "East Riding of Yorkshire", "East Sussex", "Essex",
      "Gloucestershire", "Greater London", "Greater Manchester", "Hampshire", "Herefordshire", "Hertfordshire",
      "Isle of Wight", "Kent", "Lancashire", "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", "North Yorkshire",
      "Northamptonshire", "Northumberland", "Nottinghamshire", "Oxfordshire", "Rutland", "Shropshire", "Somerset",
      "South Yorkshire", "Staffordshire", "Suffolk", "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands",
      "West Sussex", "West Yorkshire", "Wiltshire", "Worcestershire",
    ]),
  },
  { label: "Wales", regions: slugs(["Clwyd", "Dyfed", "Gwent", "Gwynedd", "Mid Glamorgan", "Powys", "South Glamorgan", "West Glamorgan"]) },
  {
    label: "Scotland",
    regions: slugs([
      "Aberdeen City", "Aberdeenshire", "Angus", "Argyll and Bute", "City of Edinburgh", "Clackmannanshire",
      "Dumfries and Galloway", "Dundee City", "East Ayrshire", "East Dunbartonshire", "East Lothian", "East Renfrewshire",
      "Falkirk", "Fife", "Glasgow City", "Highland", "Inverclyde", "Midlothian", "Moray", "Na h-Eileanan Siar",
      "North Ayrshire", "North Lanarkshire", "Orkney Islands", "Perth and Kinross", "Renfrewshire", "Scottish Borders",
      "Shetland Islands", "South Ayrshire", "South Lanarkshire", "Stirling", "West Dunbartonshire", "West Lothian",
    ]),
  },
  { label: "Northern Ireland", regions: slugs(["Antrim", "Armagh", "Down", "Fermanagh", "Londonderry", "Tyrone"]) },
];

const postal = (label: string, pattern: RegExp, example: string, extra: Partial<CountryConfig["postal"]> = {}): CountryConfig["postal"] => ({
  label,
  pattern,
  example,
  invalid: `Enter a valid ${label.toLowerCase()}, like ${example}.`,
  ...extra,
});

export const COUNTRY_LIST: CountryConfig[] = [
  {
    code: "US",
    name: "United States",
    region: { kind: "list", label: "State", required: true, regions: US_STATES },
    postal: postal("ZIP code", /^\d{5}(-\d{4})?$/, "10012", { invalid: "Enter a 5-digit ZIP code." }),
    phone: { dial: "1", trunk: "1", nsn: [10, 10], placeholder: "(212) 555-0100" },
  },
  {
    code: "TH",
    name: "Thailand",
    region: { kind: "list", label: "Province", required: true, regions: TH_PROVINCES },
    postal: postal("Postal code", /^\d{5}$/, "10330"),
    phone: { dial: "66", trunk: "0", nsn: [8, 9], placeholder: "+66 81 234 5678" },
  },
  {
    code: "GB",
    name: "United Kingdom",
    region: { kind: "groups", label: "County", required: false, groups: UK_COUNTIES },
    postal: postal("Postcode", /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, "SW1A 1AA", { uppercase: true }),
    phone: { dial: "44", trunk: "0", nsn: [9, 10], placeholder: "+44 20 7946 0000" },
  },
  {
    code: "CA",
    name: "Canada",
    region: { kind: "list", label: "Province", required: true, regions: CA_PROVINCES },
    postal: postal("Postal code", /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i, "M5V 2T6", { uppercase: true }),
    phone: { dial: "1", trunk: "1", nsn: [10, 10], placeholder: "(416) 555-0100" },
  },
  {
    code: "AU",
    name: "Australia",
    region: { kind: "list", label: "State", required: true, regions: AU_STATES },
    postal: postal("Postcode", /^\d{4}$/, "2000"),
    phone: { dial: "61", trunk: "0", nsn: [9, 9], placeholder: "+61 4 1234 5678" },
  },
  {
    code: "JP",
    name: "Japan",
    region: { kind: "list", label: "Prefecture", required: true, regions: JP_PREFECTURES },
    postal: postal("Postal code", /^\d{3}-?\d{4}$/, "104-0061"),
    phone: { dial: "81", trunk: "0", nsn: [9, 10], placeholder: "+81 3 1234 5678" },
  },
  {
    code: "SG",
    name: "Singapore",
    region: { kind: "none" },
    postal: postal("Postal code", /^\d{6}$/, "238859"),
    phone: { dial: "65", trunk: "", nsn: [8, 8], placeholder: "+65 6123 4567" },
  },
  {
    code: "FR",
    name: "France",
    region: { kind: "none" },
    postal: postal("Postal code", /^\d{5}$/, "75008"),
    phone: { dial: "33", trunk: "0", nsn: [9, 9], placeholder: "+33 1 23 45 67 89" },
  },
  {
    code: "DE",
    name: "Germany",
    region: { kind: "none" },
    postal: postal("Postal code", /^\d{5}$/, "10117"),
    phone: { dial: "49", trunk: "0", nsn: [6, 11], placeholder: "+49 30 123456" },
  },
];

export const DEFAULT_COUNTRY = "US";
/** Ships from New York — everything else is international (transit times, duties). */
export const HOME_COUNTRY = "US";

const BY_CODE = new Map(COUNTRY_LIST.map((c) => [c.code, c]));

export function getCountry(code: string | null | undefined): CountryConfig {
  return (code && BY_CODE.get(code)) || BY_CODE.get(DEFAULT_COUNTRY)!;
}
export const isKnownCountry = (code: string) => BY_CODE.has(code);

export function regionsOf(country: CountryConfig): Region[] {
  if (country.region.kind === "list") return country.region.regions;
  if (country.region.kind === "groups") return country.region.groups.flatMap((g) => g.regions);
  return [];
}
export const hasRegions = (country: CountryConfig) => country.region.kind !== "none";
export const regionLabel = (country: CountryConfig) => (country.region.kind === "none" ? "" : country.region.label);
export const regionRequired = (country: CountryConfig) => country.region.kind !== "none" && country.region.required;

export function countryName(code: string): string {
  return BY_CODE.get(code)?.name ?? code;
}
export function regionName(countryCode: string, regionCode: string): string {
  if (!regionCode) return "";
  return regionsOf(getCountry(countryCode)).find((x) => x.code === regionCode)?.name ?? regionCode;
}

/** Local ("081 234 5678") or international ("+66 81 234 5678", "0066…") — checked against that country's number length. */
export function isValidPhone(value: string, countryCode: string): boolean {
  const { dial, trunk, nsn } = getCountry(countryCode).phone;
  const compact = value.replace(/\(0\)/g, "").replace(/[\s().-]/g, "");
  let national: string;
  if (/^(\+|00)/.test(compact)) {
    const digits = compact.replace(/^(\+|00)/, "");
    if (!digits.startsWith(dial)) return false;
    national = digits.slice(dial.length);
  } else {
    if (trunk === "0") {
      // Countries with a "0" trunk prefix write local numbers with it — "81 234 5678" alone is ambiguous.
      if (!compact.startsWith("0")) return false;
      national = compact.slice(1);
    } else {
      // NANP: the leading "1" is optional locally.
      national = trunk && compact.length > nsn[1] && compact.startsWith(trunk) ? compact.slice(trunk.length) : compact;
    }
  }
  return /^\d+$/.test(national) && national.length >= nsn[0] && national.length <= nsn[1];
}

export function normalisePostal(value: string, countryCode: string): string {
  const v = value.trim();
  return getCountry(countryCode).postal.uppercase ? v.toUpperCase() : v;
}

/** "Bangkok 10330" / "New York, New York 10012" / "Singapore 238859" — the city line of a displayed address. */
export function formatCityLine(a: { city: string; state: string; zip: string; country: string }): string {
  const region = regionName(a.country, a.state);
  return [a.city, region].filter(Boolean).join(", ") + (a.zip ? ` ${a.zip}` : "");
}

/**
 * Pre-codes addresses stored full names ("United States" / "New York"). Map any name to its code so saved
 * addresses, orders and in-progress checkouts from before this change keep working. Idempotent.
 */
export function migrateAddress<T extends { country?: string; state?: string }>(a: T): T {
  if (!a) return a;
  let country = a.country ?? DEFAULT_COUNTRY;
  if (!isKnownCountry(country)) {
    const byName = COUNTRY_LIST.find((c) => c.name.toLowerCase() === country.trim().toLowerCase());
    country = byName?.code ?? DEFAULT_COUNTRY;
  }
  let state = a.state ?? "";
  const regions = regionsOf(getCountry(country));
  if (state && !regions.some((x) => x.code === state)) {
    state = regions.find((x) => x.name.toLowerCase() === state.trim().toLowerCase())?.code ?? "";
  }
  return country === a.country && state === a.state ? a : { ...a, country, state };
}
